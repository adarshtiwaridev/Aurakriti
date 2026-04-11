import { authOptionsHandler, verifyOtpHandler } from '@/lib/auth-api';

export const POST = verifyOtpHandler;
export const OPTIONS = authOptionsHandler;
