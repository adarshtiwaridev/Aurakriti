import { authOptionsHandler, loginHandler } from '@/lib/auth-api';

export const POST = loginHandler;
export const OPTIONS = authOptionsHandler;
