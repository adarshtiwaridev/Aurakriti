import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import Notification from '@/models/Notification';
import { mapNotification } from '@/lib/notifications';

export async function PATCH(request, context) {
  const { id } = await context.params;
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: 'Invalid notification id.' }, { status: 400 });
  }

  await connectDB();

  const filter = { _id: id };
  if (auth.user.role === 'seller' || auth.user.role === 'admin') {
    filter.sellerId = auth.user._id;
  } else {
    filter.userId = auth.user._id;
  }

  const notification = await Notification.findOneAndUpdate(
    filter,
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  ).lean();

  if (!notification) {
    return NextResponse.json({ success: false, message: 'Notification not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      notification: mapNotification(notification),
    },
  });
}
