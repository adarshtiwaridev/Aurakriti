import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import Notification from '@/models/Notification';
import { mapNotification } from '@/lib/notifications';

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100);

  const role = auth.user.role;
  const baseQuery = role === 'seller' || role === 'admin'
    ? { sellerId: auth.user._id }
    : { userId: auth.user._id };

  const query = unreadOnly ? { ...baseQuery, isRead: false } : baseQuery;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({ ...baseQuery, isRead: false });

  return NextResponse.json({
    success: true,
    data: {
      notifications: notifications.map(mapNotification),
      unreadCount,
    },
  });
}
