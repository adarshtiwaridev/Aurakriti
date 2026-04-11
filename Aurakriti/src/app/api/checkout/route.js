import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import User from '@/models/User';
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

  if (!isCOD) {
    return NextResponse.json(
      { success: false, message: 'Online payments must use /api/payment/create-order.' },
      { status: 400 }
    );
  }

  try {
    const { order, amounts } = await createOrderFromCart({
      userId: auth.user._id,
      shippingAddress,
      method: 'cod',
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: String(order._id),
        paymentId: null,
        status: order.paymentStatus,
        amounts,
        cod: true,
        razorpay: null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Unable to create checkout order.' }, { status: 400 });
  }
}
