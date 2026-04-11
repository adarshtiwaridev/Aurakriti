import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import User from '@/models/User';

export const unauthorizedResponse = (message = 'Unauthorized') =>
  NextResponse.json({ success: false, message }, { status: 401 });

export const forbiddenResponse = (message = 'Forbidden') =>
  NextResponse.json({ success: false, message }, { status: 403 });

export async function requireAuth(request) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return { error: unauthorizedResponse() };
  }

  const payload = verifyToken(token);
  if (!payload?.userId) {
    return { error: unauthorizedResponse() };
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return { error: unauthorizedResponse() };
  }

  return { user };
}

export async function requireRole(request, roles = []) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth;
  }

  if (!roles.includes(auth.user.role)) {
    return { error: forbiddenResponse('You do not have permission to perform this action.') };
  }

  return auth;
}
