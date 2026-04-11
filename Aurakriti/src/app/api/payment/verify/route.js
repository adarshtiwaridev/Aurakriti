import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Order from '@/models/Order';
import { finalizeOrderPayment, mapOrder } from '@/lib/order-utils';
import { sendEmail, sendOrderConfirmationEmail } from '@/lib/email';
import { notifySellersForNewOrder } from '@/lib/notifications';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { generateAndStoreInvoice } from '@/lib/invoice';
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
    const order = await Order.findOne(
      isObjectId
        ? { _id: orderId, user: auth.user._id }
        : { 'paymentDetails.razorpayOrderId': orderId, user: auth.user._id }
    );
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (order.paymentProvider !== 'razorpay') {
      return NextResponse.json({ success: false, message: 'This endpoint verifies Razorpay payments only.' }, { status: 400 });
    }

    if (order.paymentStatus === 'failed') {
      return NextResponse.json({ success: false, message: 'This payment attempt is already marked as failed.' }, { status: 409 });
    }

    if (order.paymentStatus === 'paid') {
      if (order.paymentDetails?.razorpayPaymentId && order.paymentDetails.razorpayPaymentId !== razorpay_payment_id) {
        return NextResponse.json({ success: false, message: 'Order already paid with a different payment id.' }, { status: 409 });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment already verified for this order.',
        data: {
          ...mapOrder(order, auth.user),
          paymentId: order.paymentDetails?.razorpayPaymentId || razorpay_payment_id,
          status: order.paymentStatus,
        },
      });
    }

    if (order.paymentDetails?.razorpayOrderId && order.paymentDetails.razorpayOrderId !== razorpay_order_id) {
      order.paymentStatus = 'failed';
      order.paymentAttempts = Number(order.paymentAttempts || 0) + 1;
      order.paymentFailureReason = 'Razorpay order id mismatch';
      await order.save();
      return NextResponse.json({ success: false, message: 'Invalid payment order reference.' }, { status: 400 });
    }

    order.paymentAttempts = Number(order.paymentAttempts || 0) + 1;
    await order.save();

    const verification = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    console.log('[Payment/Verify] Verification result:', {
      orderId: String(order._id),
      razorpay_order_id,
      razorpay_payment_id,
      valid: verification.valid,
      mode: verification.mode,
    });

    if (!verification.valid) {
      order.paymentStatus = 'failed';
      order.paymentFailureReason = 'Invalid Razorpay signature';
      await order.save();
      return NextResponse.json({ success: false, message: 'Payment verification failed.' }, { status: 400 });
    }

    const populatedOrder = await finalizeOrderPayment({
      order,
      payment: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
      verificationMode: verification.mode,
      isCOD: false,
    });

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
      console.log('[Payment/Verify] Invoice generated:', {
        orderId: String(populatedOrder._id),
        fileName: invoice.fileName,
        url: invoice.publicUrl,
      });
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
      `Payment Successful #${orderCode} - EcoCommerce`,
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
      sendEmail(
        auth.user.email,
        `Invoice #${orderCode} - EcoCommerce`,
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
