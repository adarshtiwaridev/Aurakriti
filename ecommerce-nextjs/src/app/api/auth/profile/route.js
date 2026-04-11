import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { sanitizeUser } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();
  const user = await User.findById(auth.user._id);

  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      user: sanitizeUser(user),
    },
  });
}

export async function PATCH(request) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();

    const body = await request.json();
    const user = await User.findById(auth.user._id);

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const allowed = ['name', 'phone', 'profileImage', 'address'];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        user[key] = body[key];
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
