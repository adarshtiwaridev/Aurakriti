import { authOptionsHandler, resetPasswordHandler } from '@/lib/auth-api';

export const POST = resetPasswordHandler;
export const OPTIONS = authOptionsHandler;
