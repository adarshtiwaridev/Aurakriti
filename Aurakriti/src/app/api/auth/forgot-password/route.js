import { authOptionsHandler, forgotPasswordHandler } from '@/lib/auth-api';

export const POST = forgotPasswordHandler;
export const OPTIONS = authOptionsHandler;
