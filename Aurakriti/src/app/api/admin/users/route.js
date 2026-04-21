import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import User from '@/models/User';

export async function GET(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const role = searchParams.get('role');
  const search = searchParams.get('search');
  const verified = searchParams.get('verified');

  const query = {};
  if (role) query.role = role;
  if (verified !== null && verified !== '') query.isVerified = verified === 'true';
  if (search?.trim()) {
    const regex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ name: regex }, { email: regex }];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password -resetPasswordToken -resetPasswordExpires')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({
    success: true,
    data: {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

export async function PATCH(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const body = await request.json();
  const { userId, role, isVerified } = body;

  if (!userId) {
    return NextResponse.json({ success: false, message: 'userId is required.' }, { status: 400 });
  }

  // Prevent admin from demoting themselves
  if (String(auth.user._id) === String(userId) && role && role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Cannot change your own role.' }, { status: 400 });
  }

  const update = {};
  if (role && ['user', 'seller', 'admin'].includes(role)) update.role = role;
  if (typeof isVerified === 'boolean') update.isVerified = isVerified;

  if (!Object.keys(update).length) {
    return NextResponse.json({ success: false, message: 'No valid fields to update.' }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true })
    .select('-password -resetPasswordToken -resetPasswordExpires');

  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { user } });
}

export async function DELETE(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'userId is required.' }, { status: 400 });
  }

  if (String(auth.user._id) === String(userId)) {
    return NextResponse.json({ success: false, message: 'Cannot delete your own account.' }, { status: 400 });
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'User deleted successfully.' });
}
