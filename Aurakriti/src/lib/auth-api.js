import connectDB from '@/lib/db';
import { sendEmail, sendOTPEmail } from '@/lib/email';
import {
  attachCorsHeaders,
  canResendOtp,
  clearAuthCookie,
  createErrorResponse,
  createOptionsResponse,
  createSuccessResponse,
  getDashboardRoute,
  getResendAvailableInSeconds,
  generateOtp,
  hashOtp,
  isOtpExpired,
  normalizeEmail,
  normalizeOtp,
  OTP_EXPIRY_MS,
  OTP_EXPIRY_SECONDS,
  sanitizeUser,
  setAuthCookie,
  verifyHashedOtp,
} from '@/lib/auth';
import { generateToken, getTokenFromRequest, verifyToken } from '@/lib/jwt';
import Otp from '@/models/Otp';
import User from '@/models/User';

const ALLOWED_SIGNUP_ROLES = ['user', 'seller'];
const VERIFICATION_PURPOSE = 'verification';
const RESET_PURPOSE = 'reset-password';

const parseRequestBody = async (request) => {
  try {
    const body = await request.json();
    console.log('Parsed request body:', JSON.stringify(body));
    return body;
  } catch (error) {
    console.error('Error parsing request body:', error);
    return {};
  }
};

const withErrorHandling = (label, handler) => async (request) => {
  try {
    const response = await handler(request);
    return attachCorsHeaders(response, request);
  } catch (error) {
    console.error(`${label} error:`, error);

    if (error?.code === 11000) {
      return attachCorsHeaders(
        createErrorResponse('An account with this email already exists.', {}, 409),
        request
      );
    }

    return attachCorsHeaders(createErrorResponse('Internal server error', {}, 500), request);
  }
};

const invalidatePreviousOtps = async (userId, purpose) => {
  await Otp.updateMany({ user: userId, purpose, isUsed: false }, { isUsed: true });
};

const createOtpRecord = async (userId, purpose) => {
  try {
    const otp = generateOtp();
    console.log('Generated OTP:', otp, 'for purpose:', purpose);
    
    const codeHash = await hashOtp(otp);
    console.log('Hashed OTP:', codeHash);
    
    const sentAt = new Date();
    const expiresAt = new Date(sentAt.getTime() + OTP_EXPIRY_MS);

    const otpData = {
      user: userId,
      codeHash,
      purpose,
      sentAt,
      expiresAt,
      isUsed: false,
      attempts: 0,
    };
    
    console.log('Creating OTP record:', JSON.stringify(otpData));

    const otpRecord = await Otp.create(otpData);
    console.log('OTP record created successfully:', otpRecord._id);

    return { otpRecord, otp };
  } catch (error) {
    console.error('Error creating OTP record:', error);
    throw error;
  }
};

const getLatestOtpRecord = async (userId, purpose) => {
  try {
    const record = await Otp.findOne({ user: userId, purpose, isUsed: false }).sort({ sentAt: -1 });
    console.log('Found OTP record:', record ? record._id : 'null');
    return record;
  } catch (error) {
    console.error('Error fetching OTP record:', error);
    return null;
  }
};

const createAndSendOtp = async (user, purpose) => {
  try {
    console.log('Starting createAndSendOtp for user:', user.email, 'purpose:', purpose);
    
    await invalidatePreviousOtps(user._id, purpose);
    console.log('Invalidated previous OTPs');

    const { otpRecord, otp } = await createOtpRecord(user._id, purpose);
    console.log('OTP Record created. Now sending email...');

    try {
      await sendOTPEmail(user.email, otp, { purpose });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      console.log('Keeping OTP record despite email error');
    }
    
    return otpRecord;
  } catch (error) {
    console.error('Error in createAndSendOtp:', error);
    throw error;
  }
};

const saveUserAndSendOtp = async (user, purpose) => {
  await user.save();
  return await createAndSendOtp(user, purpose);
};

const buildVerificationData = (user, { otpSentAt, ...overrides } = {}) => ({
  email: user.email,
  requiresVerification: true,
  otpExpiresInSeconds: OTP_EXPIRY_SECONDS,
  resendAvailableInSeconds: getResendAvailableInSeconds(otpSentAt),
  redirectPath: `/auth/verify?email=${encodeURIComponent(user.email)}`,
  ...overrides,
});

export const signupHandler = withErrorHandling('Signup', async (request) => {
  console.log('=== SIGNUP HANDLER STARTED ===');
  await connectDB();
  console.log('Database connected');

  const body = await parseRequestBody(request);
  console.log('Request body:', { name: body.name, email: body.email, role: body.role });
  
  const name = String(body.name ?? '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? '');
  const role = body.role ?? 'user';

  if (!name || !email || !password) {
    console.log('Validation failed: missing fields');
    return createErrorResponse('Name, email, and password are required.', {}, 400);
  }

  if (password.length < 6) {
    console.log('Password too short');
    return createErrorResponse('Password must be at least 6 characters long.', {}, 400);
  }

  if (!ALLOWED_SIGNUP_ROLES.includes(role)) {
    console.log('Invalid role:', role);
    return createErrorResponse('Invalid role selected for signup.', {}, 400);
  }

  console.log('Checking for existing user:', email);
  const existingUser = await User.findOne({ email });
  let user;

  if (existingUser?.isVerified) {
    console.log('User already verified');
    return createErrorResponse('A verified user already exists with this email.', {}, 409);
  }

  if (existingUser) {
    console.log('User exists but not verified, updating...');
    existingUser.name = name;
    existingUser.password = password;
    existingUser.role = role;
    existingUser.isVerified = false;
    user = existingUser;
  } else {
    console.log('Creating new user');
    user = new User({
      name,
      email,
      password,
      role,
    });
  }

  console.log('Saving user...');
  await user.save();
  console.log('User saved, now creating and sending OTP');

  let otpSent = false;
  let otpSentAt = null;
  let otpRecord = null;

  try {
    console.log('Calling saveUserAndSendOtp...');
    otpRecord = await createAndSendOtp(user, VERIFICATION_PURPOSE);
    console.log('OTP created and sent successfully');
    otpSent = true;
    otpSentAt = otpRecord.sentAt;
  } catch (error) {
    console.error('OTP creation/send error:', error);
    console.log('Continuing without OTP...');
  }

  console.log('=== SIGNUP HANDLER COMPLETED ===');
  return createSuccessResponse(
    otpSent
      ? 'Signup successful. Enter the OTP sent to your email to activate your account.'
      : 'Account created, but the OTP email could not be sent. Please use resend OTP to continue.',
    {
      user: sanitizeUser(user),
      ...buildVerificationData(user, { otpSent, otpSentAt }),
    },
    201
  );
});

export const loginHandler = withErrorHandling('Login', async (request) => {
  await connectDB();

  const body = await parseRequestBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? '');

  if (!email || !password) {
    return createErrorResponse('Email and password are required.', {}, 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    return createErrorResponse('Invalid email or password.', {}, 401);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return createErrorResponse('Invalid email or password.', {}, 401);
  }

  if (!user.isVerified) {
    let otpSent = false;
    let otpSentAt = null;
    const latestOtp = await getLatestOtpRecord(user._id, VERIFICATION_PURPOSE);

    if (!latestOtp || isOtpExpired(latestOtp.expiresAt)) {
      try {
        const otpRecord = await createAndSendOtp(user, VERIFICATION_PURPOSE);
        otpSent = true;
        otpSentAt = otpRecord.sentAt;
      } catch (error) {
        console.error('Login verification OTP send failed:', error);
      }
    } else {
      otpSentAt = latestOtp.sentAt;
    }

    return createErrorResponse(
      'Please verify your email before logging in.',
      buildVerificationData(user, { otpSent, otpSentAt }),
      403
    );
  }

  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  const response = createSuccessResponse('Login successful.', {
    user: sanitizeUser(user),
    token,
    redirectPath: getDashboardRoute(user.role),
  });

  setAuthCookie(response, token);
  return response;
});

export const verifyOtpHandler = withErrorHandling('Verify OTP', async (request) => {
  console.log('=== VERIFY OTP HANDLER STARTED ===');
  console.log('Request method:', request.method);
  console.log('Request headers:', Object.fromEntries(request.headers));
  
  await connectDB();

  const body = await parseRequestBody(request);
  console.log('Request body after parsing:', body);
  console.log('body.email:', body.email, 'type:', typeof body.email);
  console.log('body.otp:', body.otp, 'type:', typeof body.otp);
  
  const email = normalizeEmail(body.email);
  const otp = normalizeOtp(body.otp);

  console.log('After normalization - email:', email, 'otp:', otp);

  if (!email || !otp) {
    console.log('FAIL: Email or OTP is empty');
    return createErrorResponse('Email and OTP are required.', {}, 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    return createErrorResponse('No account found for this email.', {}, 404);
  }

  if (user.isVerified) {
    return createSuccessResponse('Email already verified. Please sign in to continue.', {
      user: sanitizeUser(user),
      redirectPath: `/auth/login?email=${encodeURIComponent(user.email)}&verified=true`,
      requiresLogin: true,
      email: user.email,
    });
  }

  const otpRecord = await getLatestOtpRecord(user._id, VERIFICATION_PURPOSE);

  if (!otpRecord) {
    return createErrorResponse(
      'No active OTP found. Please request a new verification code.',
      {},
      400
    );
  }

  if (isOtpExpired(otpRecord.expiresAt)) {
    return createErrorResponse(
      'This OTP has expired. Please request a new verification code.',
      { code: 'OTP_EXPIRED' },
      400
    );
  }

  const isValidOtp = await verifyHashedOtp(otp, otpRecord.codeHash);

  if (!isValidOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return createErrorResponse('The OTP you entered is invalid.', { code: 'INVALID_OTP' }, 400);
  }

  otpRecord.isUsed = true;
  await otpRecord.save();

  user.isVerified = true;
  await user.save();

  try {
    await sendEmail(
      user.email,
      'Welcome to EcoCommerce',
      `<p>Hi ${user.name},</p><p>Your email was verified successfully. Welcome to EcoCommerce.</p>`
    );
  } catch (error) {
    console.error('Welcome email failed:', error);
  }

  return createSuccessResponse('Email verified successfully. Please sign in to continue.', {
    user: sanitizeUser(user),
    redirectPath: `/auth/login?email=${encodeURIComponent(user.email)}&verified=true`,
    requiresLogin: true,
    email: user.email,
  });
});

export const resendOtpHandler = withErrorHandling('Resend OTP', async (request) => {
  console.log('=== RESEND OTP HANDLER ===');
  await connectDB();

  const body = await parseRequestBody(request);
  const email = normalizeEmail(body.email);
  const purpose = body.purpose === RESET_PURPOSE ? RESET_PURPOSE : VERIFICATION_PURPOSE;

  console.log('Resending OTP for:', email, 'purpose:', purpose);

  if (!email) {
    return createErrorResponse('Email is required to resend an OTP.', {}, 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    return createErrorResponse('No account found for this email.', {}, 404);
  }

  if (purpose === VERIFICATION_PURPOSE && user.isVerified) {
    return createErrorResponse('This account has already been verified.', {}, 400);
  }

  const latestOtp = await getLatestOtpRecord(user._id, purpose);

  if (latestOtp && !canResendOtp(latestOtp.sentAt)) {
    const retryAfter = getResendAvailableInSeconds(latestOtp.sentAt);
    console.log('Resend rate limited, retry after:', retryAfter);
    return createErrorResponse(
      'Please wait before requesting another OTP.',
      { retryAfterSeconds: retryAfter },
      429
    );
  }

  console.log('Creating and sending OTP...');
  const otpRecord = await createAndSendOtp(user, purpose);

  return createSuccessResponse(
    purpose === RESET_PURPOSE
      ? 'A new password reset OTP has been sent.'
      : 'A new verification OTP has been sent.',
    {
      email: user.email,
      purpose,
      otpExpiresInSeconds: OTP_EXPIRY_SECONDS,
      resendAvailableInSeconds: getResendAvailableInSeconds(otpRecord.sentAt),
    }
  );
});

export const forgotPasswordHandler = withErrorHandling('Forgot password', async (request) => {
  await connectDB();

  const body = await parseRequestBody(request);
  const email = normalizeEmail(body.email);

  if (!email) {
    return createErrorResponse('Email is required.', {}, 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    return createSuccessResponse(
      'If an account with that email exists, a password reset OTP has been sent.',
      { email, otpRequested: false }
    );
  }

  const latestOtp = await getLatestOtpRecord(user._id, RESET_PURPOSE);

  if (latestOtp && !canResendOtp(latestOtp.sentAt)) {
    return createErrorResponse(
      'Please wait before requesting another password reset OTP.',
      { retryAfterSeconds: getResendAvailableInSeconds(latestOtp.sentAt) },
      429
    );
  }

  const otpRecord = await createAndSendOtp(user, RESET_PURPOSE);

  return createSuccessResponse('A password reset OTP has been sent to your email.', {
    email: user.email,
    otpRequested: true,
    otpExpiresInSeconds: OTP_EXPIRY_SECONDS,
    resendAvailableInSeconds: getResendAvailableInSeconds(otpRecord.sentAt),
    redirectPath: `/auth/reset-password?email=${encodeURIComponent(user.email)}`,
  });
});

export const resetPasswordHandler = withErrorHandling('Reset password', async (request) => {
  await connectDB();

  const body = await parseRequestBody(request);
  const email = normalizeEmail(body.email);
  const otp = normalizeOtp(body.otp);
  const password = String(body.password ?? '');

  if (!email || !otp || !password) {
    return createErrorResponse('Email, OTP, and password are required.', {}, 400);
  }

  if (password.length < 6) {
    return createErrorResponse('Password must be at least 6 characters long.', {}, 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    return createErrorResponse('No account found for this email.', {}, 404);
  }

  const otpRecord = await getLatestOtpRecord(user._id, RESET_PURPOSE);

  if (!otpRecord) {
    return createErrorResponse('No active reset OTP found. Please request a new code.', {}, 400);
  }

  if (isOtpExpired(otpRecord.expiresAt)) {
    return createErrorResponse(
      'This password reset OTP has expired. Please request a new one.',
      { code: 'OTP_EXPIRED' },
      400
    );
  }

  const isValidOtp = await verifyHashedOtp(otp, otpRecord.codeHash);

  if (!isValidOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return createErrorResponse('The OTP you entered is invalid.', { code: 'INVALID_OTP' }, 400);
  }

  otpRecord.isUsed = true;
  await otpRecord.save();

  user.password = password;
  await user.save();

  return createSuccessResponse('Password reset successfully. You can now sign in.');
});

export const logoutHandler = withErrorHandling('Logout', async () => {
  const response = createSuccessResponse('Logged out successfully.');
  clearAuthCookie(response);
  return response;
});

export const meHandler = withErrorHandling('Session', async (request) => {
  const token = getTokenFromRequest(request);

  if (!token) {
    return createErrorResponse('Unauthorized.', {}, 401);
  }

  const payload = verifyToken(token);

  if (!payload?.userId) {
    const invalidTokenResponse = createErrorResponse('Unauthorized.', {}, 401);
    clearAuthCookie(invalidTokenResponse);
    return invalidTokenResponse;
  }

  await connectDB();

  const user = await User.findById(payload.userId);

  if (!user) {
    const missingUserResponse = createErrorResponse('Unauthorized.', {}, 401);
    clearAuthCookie(missingUserResponse);
    return missingUserResponse;
  }

  return createSuccessResponse('Session loaded successfully.', {
    user: sanitizeUser(user),
    redirectPath: getDashboardRoute(user.role),
  });
});

export const authOptionsHandler = async (request) => createOptionsResponse(request);
