import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { createPaymentOrder } from '@/lib/razorpay';
import { buildOrderDataFromCart } from '@/lib/order-utils';
import PaymentSession from '@/models/PaymentSession';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();
    const body = await request.json();
    const shippingAddress = body.shippingAddress ?? {};

    console.log('[Payment/CreateOrder] Request received for user:', String(auth.user._id));

    const cartOrderData = await buildOrderDataFromCart({
      userId: auth.user._id,
      shippingAddress,
    });

    const paymentOrder = await createPaymentOrder({
      amount: cartOrderData.amounts.totalAmount,
      receipt: `eco-${Date.now().toString().slice(-10)}`,
      notes: {
        userId: auth.user._id.toString(),
      },
    });

    const session = await PaymentSession.create({
      user: auth.user._id,
      shippingAddress: cartOrderData.shippingAddress,
      items: cartOrderData.items,
      subtotal: cartOrderData.amounts.subtotal,
      shippingFee: cartOrderData.amounts.shippingFee,
      totalAmount: cartOrderData.amounts.totalAmount,
      razorpayOrderId: paymentOrder.id,
      verificationMode: paymentOrder.mode,
      status: 'created',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    console.log('[Payment/CreateOrder] Razorpay order created:', {
      sessionId: String(session._id),
      razorpayOrderId: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      mode: paymentOrder.mode,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: String(session._id),
        paymentId: null,
        status: session.status,
        amounts: cartOrderData.amounts,
        razorpay: paymentOrder,
      },
    });
  } catch (error) {
    console.error('POST /api/payment/create-order failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Unable to create payment order.' }, { status: 400 });
  }
}
