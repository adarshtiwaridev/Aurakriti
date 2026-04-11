import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import User from '@/models/User';
import { createPaymentOrder } from '@/lib/razorpay';
import { createOrderFromCart } from '@/lib/order-utils';

void User;

export async function POST(request) {
  const auth = await requireRole(request, ['user']);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const body = await request.json();
  const shippingAddress = body.shippingAddress ?? {};
  const isCOD = body.method === 'cod';

  try {
    const { order, amounts } = await createOrderFromCart({
      userId: auth.user._id,
      shippingAddress,
      method: isCOD ? 'cod' : 'online',
    });

    let razorpayData = null;
    if (!isCOD) {
      const paymentOrder = await createPaymentOrder({
        amount: amounts.totalAmount,
        receipt: `eco-${order._id.toString().slice(-10)}`,
        notes: {
          orderId: order._id.toString(),
          userId: auth.user._id.toString(),
        },
      });
      order.paymentDetails = { ...order.paymentDetails, razorpayOrderId: paymentOrder.id, mode: paymentOrder.mode };
      await order.save();
      razorpayData = paymentOrder;
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: String(order._id),
        paymentId: null,
        status: order.paymentStatus,
        amounts,
        cod: isCOD,
        razorpay: razorpayData,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to create checkout order.' }, { status: 400 });
  }
}
