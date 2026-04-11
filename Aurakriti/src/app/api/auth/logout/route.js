import { authOptionsHandler, logoutHandler } from '@/lib/auth-api';

export const POST = logoutHandler;
export const OPTIONS = authOptionsHandler;
