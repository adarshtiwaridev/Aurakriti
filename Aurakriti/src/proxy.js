import { NextResponse } from 'next/server';

// In-memory store
const rateLimitStore = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Rate limiting
  if (pathname.startsWith('/api/auth/')) {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;

    let requestData = rateLimitStore.get(ip);

    if (!requestData || requestData.startTime < windowStart) {
      requestData = {
        count: 0,
        startTime: now,
      };
    }

    requestData.count++;
    rateLimitStore.set(ip, requestData);

    if (requestData.count > MAX_REQUESTS) {
      return NextResponse.json(
        {
          error: 'Too many requests',
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // Admin auth check
  if (pathname.startsWith('/api/admin/')) {
    const token =
      request.headers
        .get('authorization')
        ?.split(' ')[1] ||
      request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
  }

  // Security headers
  const response = NextResponse.next();

  response.headers.set(
    'X-Content-Type-Options',
    'nosniff'
  );

  response.headers.set(
    'X-Frame-Options',
    'DENY'
  );

  response.headers.set(
    'X-XSS-Protection',
    '1; mode=block'
  );

  // CSRF token
  if (!request.cookies.has('csrfToken')) {
    const csrfToken =
      Math.random().toString(36).substring(2) +
      Math.random().toString(36).substring(2);

    response.cookies.set(
      'csrfToken',
      csrfToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      }
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};