import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { sanitizeUser } from '@/lib/auth';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const [user, orders] = await Promise.all([
      User.findById(auth.user._id),
      Order.find({ user: auth.user._id }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        metrics: {
          orders: orders.length,
          totalSpent,
          phone: user.phone || '',
        },
      },
    });
  } catch (error) {
    console.error('GET /api/user/profile failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to load profile.' }, { status: 500 });
  }
}
