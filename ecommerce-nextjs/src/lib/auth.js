import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'ecocommerce_auth';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_EXPIRY_SECONDS = OTP_EXPIRY_MS / 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

export const normalizeOtp = (otp = '') => String(otp).trim();

export const generateOtp = () => randomInt(100000, 1000000).toString();

export const hashOtp = async (otp) => bcrypt.hash(String(otp).trim(), 12);

export const verifyHashedOtp = async (otp, hash) => bcrypt.compare(String(otp).trim(), hash);

export const isOtpExpired = (otpExpiry) => {
  if (!otpExpiry) {
    return true;
  }

  return new Date(otpExpiry).getTime() <= Date.now();
};

export const getResendAvailableInSeconds = (otpSentAt) => {
  if (!otpSentAt) {
    return 0;
  }

  const availableAt = new Date(otpSentAt).getTime() + OTP_RESEND_COOLDOWN_MS;
  return Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
};

export const canResendOtp = (otpSentAt) => getResendAvailableInSeconds(otpSentAt) === 0;

export const sanitizeUser = (user) => {
  const userObject = typeof user.toObject === 'function' ? user.toObject() : user;

  return {
    id: String(userObject._id ?? userObject.id),
    name: userObject.name,
    email: userObject.email,
    role: userObject.role,
    isVerified: Boolean(userObject.isVerified),
    profileImage: userObject.profileImage ?? '',
    phone: userObject.phone ?? '',
    address: userObject.address ?? {},
    createdAt: userObject.createdAt ?? null,
    updatedAt: userObject.updatedAt ?? null,
  };
};

export const getDashboardRoute = (role = 'user') => {
  if (role === 'admin') {
    return '/admin/dashboard';
  }

  if (role === 'seller') {
    return '/seller/dashboard';
  }

  return '/user/dashboard';
};

export const createSuccessResponse = (message, data = {}, status = 200) =>
  NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );

export const createErrorResponse = (message, data = {}, status = 400) =>
  NextResponse.json(
    {
      success: false,
      message,
      data,
    },
    { status }
  );

export const setAuthCookie = (response, token) => {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
};

export const clearAuthCookie = (response) => {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
};

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

export const resolveAllowedOrigin = (request) => {
  const requestOrigin = request.headers.get('origin');
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_API_URL,
    ...DEFAULT_ALLOWED_ORIGINS,
  ].filter(Boolean);

  if (!requestOrigin) {
    return configuredOrigins[0] ?? DEFAULT_ALLOWED_ORIGINS[0];
  }

  if (configuredOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  const requestHost = request.headers.get('host');

  if (requestHost) {
    const requestProtocol = request.nextUrl?.protocol ?? 'http:';
    const sameOrigin = `${requestProtocol}//${requestHost}`;

    if (sameOrigin === requestOrigin) {
      return requestOrigin;
    }
  }

  return configuredOrigins[0] ?? requestOrigin;
};

export const attachCorsHeaders = (response, request) => {
  const allowedOrigin = resolveAllowedOrigin(request);

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Vary', 'Origin');

  return response;
};

export const createOptionsResponse = (request) => {
  const response = new NextResponse(null, { status: 204 });
  return attachCorsHeaders(response, request);
};
