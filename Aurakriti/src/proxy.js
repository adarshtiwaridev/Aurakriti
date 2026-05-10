import { NextResponse } from 'next/server';
import helmet from 'helmet';
import { jwtVerify } from 'jose';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;
const AUTH_COOKIE_NAME = 'ecocommerce_auth';
const CSRF_COOKIE_NAME = 'csrfToken';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '60 s'),
      prefix: 'aurakriti:auth',
    })
  : null;

const helmetDefaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
const contentSecurityPolicyHeader = Object.entries(helmetDefaultDirectives)
  .map(([directive, value]) => {
    const directiveValues = Array.isArray(value) ? value.join(' ') : '';
    return directiveValues ? `${directive} ${directiveValues}` : directive;
  })
  .join('; ');

const getClientIp = (request) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
};

const createCsrfToken = () =>
  `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;

const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  return secret ? new TextEncoder().encode(secret) : null;
};

const resolveAllowedOrigin = (request) => {
  const requestOrigin = request.headers.get('origin');
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '',
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ].filter(Boolean);

  if (!requestOrigin) {
    return configuredOrigins[0] || 'http://localhost:3000';
  }

  if (configuredOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  const requestHost = request.headers.get('host');
  if (!requestHost) {
    return configuredOrigins[0] || requestOrigin;
  }

  const protocol = request.nextUrl?.protocol || 'http:';
  const sameOrigin = `${protocol}//${requestHost}`;
  return sameOrigin === requestOrigin ? requestOrigin : configuredOrigins[0] || requestOrigin;
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  const isMutatingRequest = MUTATING_METHODS.has(request.method);

  if (isMutatingRequest && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    if (origin) {
      const allowedOrigin = resolveAllowedOrigin(request);
      if (origin !== allowedOrigin) {
        return NextResponse.json(
          { error: 'Invalid request origin' },
          { status: 403 }
        );
      }
    }
  }

  // Rate limiting
  if (pathname.startsWith('/api/auth/')) {
    if (!authRateLimiter) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Rate limiter is not configured' },
          { status: 500 }
        );
      }
    } else {
      const { success, reset } = await authRateLimiter.limit(`auth:${ip}`);
      if (!success) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((reset - Date.now()) / 1000)
        );
        return NextResponse.json(
          {
            error: 'Too many requests',
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSeconds),
            },
          }
        );
      }
    }
  }

  // Admin auth check
  if (pathname.startsWith('/api/admin/')) {
    const token =
      request.headers
        .get('authorization')
        ?.split(' ')[1] ||
      request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    const jwtSecret = getJwtSecretKey();
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'JWT secret is not configured' },
        { status: 500 }
      );
    }

    let payload = null;
    try {
      const verifiedToken = await jwtVerify(token, jwtSecret);
      payload = verifiedToken.payload;
    } catch {
      payload = null;
    }

    if (!payload?.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden access' },
        { status: 403 }
      );
    }
  }

  // CSRF validation for authenticated mutating requests
  if (isMutatingRequest && pathname.startsWith('/api/')) {
    const hasAuthCookie = request.cookies.has(AUTH_COOKIE_NAME);
    if (hasAuthCookie) {
      const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
      const csrfHeader = request.headers.get('x-csrf-token');
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
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
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );

  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeader
  );

  // CSRF token
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  if (!request.cookies.has(CSRF_COOKIE_NAME)) {
    const csrfToken = createCsrfToken();

    response.cookies.set(
      CSRF_COOKIE_NAME,
      csrfToken,
      {
        httpOnly: false,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
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