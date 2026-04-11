import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Order from '@/models/Order';
import { finalizeOrderPayment, mapOrder } from '@/lib/order-utils';
import { generateAndStoreInvoice } from '@/lib/invoice';
import { sendOrderConfirmationEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required.' }, { status: 400 });
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

    if (order.paymentProvider !== 'cod') {
      if (order.paymentStatus === 'paid') {
        return NextResponse.json({
          success: true,
          data: mapOrder(order, auth.user),
        });
      }

      return NextResponse.json(
        { success: false, message: 'Online orders can only be confirmed after payment verification.' },
        { status: 400 }
      );
    }

    let finalizedOrder = order;
    if (order.paymentStatus !== 'paid') {
      finalizedOrder = await finalizeOrderPayment({
        order,
        verificationMode: 'cod',
        isCOD: true,
      });
    }

    if (!finalizedOrder.invoice?.url) {
      try {
        const invoice = await generateAndStoreInvoice(finalizedOrder, auth.user);
        finalizedOrder.invoice = {
          url: invoice.publicUrl,
          path: invoice.absolutePath,
          fileName: invoice.fileName,
          generatedAt: new Date(),
        };
        await finalizedOrder.save();
      } catch (invoiceError) {
        console.error('[Order/Confirm] Invoice generation failed:', invoiceError);
      }
    }

    sendOrderConfirmationEmail(finalizedOrder, auth.user).catch((error) =>
      console.error('[Order/Confirm] Confirmation email error:', error.message)
    );

    return NextResponse.json({
      success: true,
      data: mapOrder(finalizedOrder, auth.user),
    });
  } catch (error) {
    console.error('POST /api/order/confirm failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to confirm order.' }, { status: 500 });
  }
}
