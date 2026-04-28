import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { enforceCors } from '@/lib/server/cors';

const PROTECTED_PATHS = ['/api/audio/resolve'];
const LIMITER_WINDOW = '1 m';
const LIMITER_MAX_REQUESTS = 10;

let edgeLimiter: Ratelimit | null = null;

function getRequestIp(request: NextRequest): string | null {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0]?.trim() || null;

  const fallbackIp =
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-vercel-forwarded-for');

  return fallbackIp?.trim() || null;
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

function hasUpstashConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getLimiter() {
  if (edgeLimiter) return edgeLimiter;
  edgeLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(LIMITER_MAX_REQUESTS, LIMITER_WINDOW),
    analytics: true,
    prefix: 'musiclabs:edge:audio-resolve',
  });
  return edgeLimiter;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const cors = enforceCors(request, {
    allowedMethods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  if (cors.response) {
    return cors.response;
  }

  if (!hasUpstashConfig()) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Rate limiter is not configured' },
        { status: 503 }
      );
    }
    const response = NextResponse.next();
    Object.entries(cors.corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const requestIp = getRequestIp(request);
  if (!requestIp && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden: missing client IP' }, { status: 403 });
  }

  const limiter = getLimiter();
  const identifier = `${requestIp ?? 'dev-local'}:${pathname}`;
  const result = await limiter.limit(identifier);
  if (!result.success) {
    const retryAfter = Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1);
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(retryAfter),
        },
      }
    );
  }

  const response = NextResponse.next();
  Object.entries(cors.corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1))
  );
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
