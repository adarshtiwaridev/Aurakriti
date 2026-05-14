import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'ecocommerce_auth';
const CSRF_COOKIE_NAME = 'csrfToken';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const getClientIp = (request) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') || '127.0.0.1';
};

const createNonce = () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...randomBytes));
};

const createCsrfToken = () =>
  `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;

const resolveAllowedOrigin = (request) => {
  const requestOrigin = request.headers.get('origin');
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '',
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

const buildContentSecurityPolicy = (nonce) => {
  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'self'`,
    `form-action 'self' https://checkout.razorpay.com https://api.razorpay.com`,
    `object-src 'none'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com https://cdn.razorpay.com ${process.env.NODE_ENV !== 'production' ? "'unsafe-eval'" : ''}`.trim(),
    `style-src 'self' 'unsafe-inline' https:`,
    `img-src 'self' data: blob: https://*.razorpay.com https:`,
    `font-src 'self' data: https:`,
    `connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https: ws: wss:`,
    `frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com`,
    `worker-src 'self' blob:`,
    `media-src 'self' blob: data: https:`,
  ];

  if (process.env.NODE_ENV === 'production') {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const isMutatingRequest = MUTATING_METHODS.has(request.method);
  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-csp', contentSecurityPolicy);
  requestHeaders.set('x-client-ip', getClientIp(request));

  if (isMutatingRequest && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    if (origin) {
      const allowedOrigin = resolveAllowedOrigin(request);
      if (origin !== allowedOrigin) {
        return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
      }
    }
  }

  if (isMutatingRequest && pathname.startsWith('/api/')) {
    const hasAuthCookie = request.cookies.has(AUTH_COOKIE_NAME);
    if (hasAuthCookie) {
      const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
      const csrfHeader = request.headers.get('x-csrf-token');

      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
      }
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('x-nonce', nonce);

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  if (!request.cookies.has(CSRF_COOKIE_NAME)) {
    response.cookies.set(CSRF_COOKIE_NAME, createCsrfToken(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|site.webmanifest).*)'],
};
