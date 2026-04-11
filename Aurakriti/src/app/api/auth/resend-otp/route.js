import { authOptionsHandler, resendOtpHandler } from '@/lib/auth-api';

export const POST = resendOtpHandler;
export const OPTIONS = authOptionsHandler;
