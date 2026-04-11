import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import Order from '@/models/Order';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { finalizeOrderPayment, mapOrder } from '@/lib/order-utils';
import { notifySellersForNewOrder } from '@/lib/notifications';
import mongoose from 'mongoose';
import { generateAndStoreInvoice } from '@/lib/invoice';

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (view && !['user', 'seller'].includes(view)) {
    return NextResponse.json({ success: false, message: 'Invalid view parameter.' }, { status: 400 });
  }

  const query = {};
  if (auth.user.role === 'user' || view === 'user') {
    query.user = auth.user._id;
  } else if (auth.user.role === 'seller' || view === 'seller') {
    query['items.seller'] = auth.user._id;
  }

  const orders = await Order.find(query)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    success: true,
    data: {
      orders: orders.map((order) => mapOrder(order, auth.user)),
    },
  });
}

export async function POST(request) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  if (auth.user.role !== 'user') {
    return NextResponse.json({ success: false, message: 'Only buyers can place orders.' }, { status: 403 });
  }

  await connectDB();
  const body = await request.json();
  const { orderId, payment = {} } = body;

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
    return NextResponse.json(
      { success: false, message: 'Online payments must be verified via /api/payment/verify before order confirmation.' },
      { status: 400 }
    );
  }

  if (order.paymentStatus === 'paid') {
    return NextResponse.json({
      success: true,
      data: mapOrder(order, auth.user),
    });
  }

  const isCOD = order.paymentProvider === 'cod' || payment?.method === 'cod';
  const verification = { mode: 'cod' };

  let populatedOrder;
  try {
    populatedOrder = await finalizeOrderPayment({
      order,
      payment: {
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id ?? `mock_payment_${Date.now()}`,
        razorpay_signature: payment.razorpay_signature ?? 'mock_signature',
      },
      verificationMode: verification.mode,
      isCOD,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to finalize order.' }, { status: 400 });
  }

  try {
    const invoice = await generateAndStoreInvoice(populatedOrder, auth.user);
    populatedOrder.invoice = {
      url: invoice.publicUrl,
      path: invoice.absolutePath,
      fileName: invoice.fileName,
      generatedAt: new Date(),
    };
    await populatedOrder.save();
  } catch (invoiceError) {
    console.error('[Orders] Invoice generation failed:', invoiceError);
  }

  sendOrderConfirmationEmail(populatedOrder, auth.user).catch((e) =>
    console.error('Order confirmation email error:', e.message)
  );
  notifySellersForNewOrder(populatedOrder, auth.user).catch((e) =>
    console.error('Seller notification error:', e.message)
  );

  return NextResponse.json({
    success: true,
    message: 'Order placed successfully.',
    data: {
      ...mapOrder(populatedOrder, auth.user),
      paymentId: populatedOrder.paymentDetails?.razorpayPaymentId ?? null,
      status: populatedOrder.paymentStatus,
    },
  });
}
