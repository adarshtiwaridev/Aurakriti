import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import Notification from '@/models/Notification';

export async function PATCH(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  await connectDB();

  const scopeQuery = auth.user.role === 'seller' || auth.user.role === 'admin'
    ? { sellerId: auth.user._id }
    : { userId: auth.user._id };

  const result = await Notification.updateMany(
    { ...scopeQuery, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return NextResponse.json({
    success: true,
    data: {
      updatedCount: result.modifiedCount || 0,
    },
  });
}
