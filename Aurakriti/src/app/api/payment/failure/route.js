import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
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
    const { orderId, razorpay_order_id, reason } = body;

    if (!orderId && !razorpay_order_id) {
      return NextResponse.json(
        { success: false, message: 'orderId or razorpay_order_id is required.' },
        { status: 400 }
      );
    }

    const query = mongoose.Types.ObjectId.isValid(orderId)
      ? { _id: orderId, user: auth.user._id }
      : { razorpayOrderId: razorpay_order_id || orderId, user: auth.user._id };

    const session = await PaymentSession.findOne(query);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Payment session not found.' }, { status: 404 });
    }

    if (session.status !== 'paid') {
      session.status = 'failed';
      session.paymentFailureReason = reason || 'Payment failed at Razorpay checkout';
      await session.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/payment/failure failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Unable to record payment failure.' }, { status: 500 });
  }
}
