import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Order from '@/models/Order';
import PaymentSession from '@/models/PaymentSession';
import { createOrderFromData, finalizeOrderPayment, mapOrder, orderPopulateConfig } from '@/lib/order-utils';
import { sendEmail, sendOrderConfirmationEmail } from '@/lib/email';
import { notifySellersForNewOrder } from '@/lib/notifications';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { generateAndStoreInvoice } from '@/lib/invoice';
import { getAppUrl } from '@/lib/app-url';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();
    const body = await request.json();
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'orderId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required.' },
        { status: 400 }
      );
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const session = await PaymentSession.findOne(
      isObjectId
        ? { _id: orderId, user: auth.user._id }
        : { razorpayOrderId: orderId, user: auth.user._id }
    );

    if (!session) {
      return NextResponse.json({ success: false, message: 'Payment session not found.' }, { status: 404 });
    }

    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now() && session.status !== 'paid') {
      session.status = 'expired';
      await session.save();
      return NextResponse.json({ success: false, message: 'Payment session expired. Please retry checkout.' }, { status: 410 });
    }

    if (session.status === 'failed') {
      return NextResponse.json({ success: false, message: 'This payment attempt is already marked as failed.' }, { status: 409 });
    }

    if (session.status === 'paid') {
      if (session.paymentId && session.paymentId !== razorpay_payment_id) {
        return NextResponse.json({ success: false, message: 'Payment already verified with a different payment id.' }, { status: 409 });
      }

      const existingOrder = session.order ? await Order.findById(session.order).populate(orderPopulateConfig) : null;
      if (!existingOrder) {
        return NextResponse.json({ success: false, message: 'Payment is verified but order record is missing.' }, { status: 409 });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment already verified for this checkout session.',
        data: {
          ...mapOrder(existingOrder, auth.user),
          paymentId: existingOrder.paymentDetails?.razorpayPaymentId || razorpay_payment_id,
          status: existingOrder.paymentStatus,
        },
      });
    }

    if (session.razorpayOrderId && session.razorpayOrderId !== razorpay_order_id) {
      session.status = 'failed';
      session.paymentAttempts = Number(session.paymentAttempts || 0) + 1;
      session.paymentFailureReason = 'Razorpay order id mismatch';
      await session.save();
      return NextResponse.json({ success: false, message: 'Invalid payment order reference.' }, { status: 400 });
    }

    const sessionFilter = isObjectId
      ? { _id: orderId, user: auth.user._id, status: 'created' }
      : { razorpayOrderId: orderId, user: auth.user._id, status: 'created' };

    const lockedSession = await PaymentSession.findOneAndUpdate(
      sessionFilter,
      { $set: { status: 'processing' }, $inc: { paymentAttempts: 1 } },
      { new: true }
    );

    if (!lockedSession) {
      const current = await PaymentSession.findOne(
        isObjectId ? { _id: orderId, user: auth.user._id } : { razorpayOrderId: orderId, user: auth.user._id }
      );

      if (current?.status === 'paid') {
        if (current.paymentId && current.paymentId !== razorpay_payment_id) {
          return NextResponse.json(
            { success: false, message: 'Payment already verified with a different payment id.' },
            { status: 409 }
          );
        }

        const existingOrder = current.order ? await Order.findById(current.order).populate(orderPopulateConfig) : null;
        if (!existingOrder) {
          return NextResponse.json(
            { success: false, message: 'Payment is verified but order record is missing.' },
            { status: 409 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Payment already verified for this checkout session.',
          data: {
            ...mapOrder(existingOrder, auth.user),
            paymentId: existingOrder.paymentDetails?.razorpayPaymentId || razorpay_payment_id,
            status: existingOrder.paymentStatus,
          },
        });
      }

      if (current?.status === 'processing') {
        return NextResponse.json(
          { success: false, message: 'Payment is already being processed. Please wait.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, message: 'Payment session is not available for verification.' },
        { status: 409 }
      );
    }

    const verification = lockedSession.verificationMode === 'mock'
      ? { valid: true, mode: 'mock' }
      : verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!verification.valid) {
      lockedSession.status = 'failed';
      lockedSession.paymentFailureReason = 'Invalid Razorpay signature';
      await lockedSession.save();
      return NextResponse.json({ success: false, message: 'Payment verification failed.' }, { status: 400 });
    }

    let populatedOrder;
    try {
      const { order: createdOrder } = await createOrderFromData({
        userId: auth.user._id,
        items: lockedSession.items,
        shippingAddress: lockedSession.shippingAddress,
        amounts: {
          subtotal: lockedSession.subtotal,
          shippingFee: lockedSession.shippingFee,
          totalAmount: lockedSession.totalAmount,
        },
        method: 'online',
        paymentDetails: {
          razorpayOrderId: lockedSession.razorpayOrderId,
          mode: verification.mode,
        },
      });

      populatedOrder = await finalizeOrderPayment({
        order: createdOrder,
        payment: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
        verificationMode: verification.mode,
        isCOD: false,
      });
    } catch (orderError) {
      lockedSession.status = 'failed';
      lockedSession.paymentFailureReason = orderError.message || 'Order creation failed';
      await lockedSession.save();
      throw orderError;
    }

    lockedSession.status = 'paid';
    lockedSession.paymentId = razorpay_payment_id;
    lockedSession.signature = razorpay_signature;
    lockedSession.order = populatedOrder._id;
    lockedSession.paymentFailureReason = '';
    await lockedSession.save();

    let invoiceMeta = null;
    try {
      const invoice = await generateAndStoreInvoice(populatedOrder, auth.user);
      populatedOrder.invoice = {
        url: invoice.publicUrl,
        path: invoice.absolutePath,
        fileName: invoice.fileName,
        generatedAt: new Date(),
      };
      await populatedOrder.save();
      invoiceMeta = invoice;
    } catch (invoiceError) {
      console.error('[Payment/Verify] Invoice generation failed:', invoiceError);
    }

    sendOrderConfirmationEmail(populatedOrder, auth.user).catch((error) =>
      console.error('Order confirmation email error:', error.message)
    );
    notifySellersForNewOrder(populatedOrder, auth.user).catch((error) =>
      console.error('Seller notification error:', error.message)
    );

    const orderCode = String(populatedOrder._id).slice(-8).toUpperCase();
    sendEmail(
      auth.user.email,
      `Payment Successful #${orderCode} - Aurakriti`,
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafb;padding:24px;border-radius:16px">
          <h2 style="color:#1e293b">Payment Successful</h2>
          <p>Hi <strong>${auth.user.name}</strong>, your payment for order <strong>#${orderCode}</strong> was successful.</p>
          <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          <p><strong>Status:</strong> Paid</p>
          <p><strong>Total:</strong> Rs ${Number(populatedOrder.totalAmount || 0).toFixed(2)}</p>
        </div>
      `
    ).catch((error) => console.error('Payment success email error:', error.message));

    if (invoiceMeta?.publicUrl) {
      const appUrl = getAppUrl();
      sendEmail(
        auth.user.email,
        `Invoice #${orderCode} - Aurakriti`,
        `<p>Your invoice is ready. <a href="${appUrl}${invoiceMeta.publicUrl}">Download Invoice PDF</a></p>`
      ).catch((error) => console.error('Invoice email error:', error.message));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...mapOrder(populatedOrder, auth.user),
        paymentId: razorpay_payment_id,
        status: populatedOrder.paymentStatus,
      },
    });
  } catch (error) {
    console.error('POST /api/payment/verify failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Payment verification failed.' }, { status: 500 });
  }
}
