import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { enforceCors } from './lib/server/cors';
import { updateSession } from './lib/supabase/middleware';

const RATE_LIMIT_CONFIGS = [
  { prefix: '/api/audio/resolve', prefix_key: 'acadmusic:edge:audio-resolve', max: 10, window: '1 m' },
  { prefix: '/api/romanize', prefix_key: 'acadmusic:edge:romanize', max: 10, window: '1 m' },
  { prefix: '/api/lyrics', prefix_key: 'acadmusic:edge:lyrics', max: 20, window: '1 m' },
  { prefix: '/api/search', prefix_key: 'acadmusic:edge:search', max: 30, window: '1 m' },
];

const DEFAULT_RATE_LIMIT = { prefix_key: 'acadmusic:edge:general', max: 60, window: '1 m' };

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(prefixKey: string, max: number, window: string): Ratelimit {
  if (limiterCache.has(prefixKey)) return limiterCache.get(prefixKey)!;
  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(max, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
    prefix: prefixKey,
  });
  limiterCache.set(prefixKey, limiter);
  return limiter;
}

function getRateLimitConfig(pathname: string) {
  const match = RATE_LIMIT_CONFIGS.find((cfg) => pathname.startsWith(cfg.prefix));
  return match
    ? { prefix_key: match.prefix_key, max: match.max, window: match.window }
    : DEFAULT_RATE_LIMIT;
}

const AUTH_REQUIRED_PREFIXES = ['/api/audio/', '/api/import/', '/api/romanize'];

function routeRequiresAuth(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasAuthCookie(request: NextRequest) {
  const cookies = request.cookies.getAll();
  const hasCookie = cookies.some(
    (c) => c.name.includes('auth-token') || c.name.includes('sb-') 
  );
  if (hasCookie) return true;

  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return true;
  }

  return false;
}

function getRequestIp(request: NextRequest): string | null {
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0]?.trim() || null;
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0]?.trim() || null;
  const fallbackIp = request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip');
  return fallbackIp?.trim() || null;
}

function hasUpstashConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Only run on API routes
    if (!pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // 1. Update Supabase session (refreshes HTTP-only cookie if needed)
    let response: NextResponse;
    try {
      response = await updateSession(request);
    } catch {
      // If Supabase config is missing or session refresh fails, continue gracefully
      response = NextResponse.next({ request });
    }

    // 2. CORS enforcement
    const cors = enforceCors(request, {
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // For OPTIONS preflight, return CORS response but preserve Set-Cookie
    if (cors.response) {
      response.headers.getSetCookie().forEach((cookie) => {
        cors.response!.headers.append('Set-Cookie', cookie);
      });
      return cors.response;
    }

    // 3. Auth gate — block unauthenticated access to expensive routes
    if (routeRequiresAuth(pathname) && !hasAuthCookie(request)) {
      const errRes = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: cors.corsHeaders }
      );
      response.headers.getSetCookie().forEach((cookie) => {
        errRes.headers.append('Set-Cookie', cookie);
      });
      return errRes;
    }

    // 4. Rate limiting
    if (!hasUpstashConfig()) {
      if (process.env.NODE_ENV === 'production') {
        const errRes = NextResponse.json(
          { error: 'Rate limiter is not configured' },
          { status: 503 }
        );
        response.headers.getSetCookie().forEach((cookie) => {
          errRes.headers.append('Set-Cookie', cookie);
        });
        return errRes;
      }
      // Dev mode: skip rate limiting, just set CORS headers
      Object.entries(cors.corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const requestIp = getRequestIp(request);
    if (!requestIp && process.env.NODE_ENV === 'production') {
      const errRes = NextResponse.json(
        { error: 'Forbidden: missing client IP' },
        { status: 403 }
      );
      response.headers.getSetCookie().forEach((cookie) => {
        errRes.headers.append('Set-Cookie', cookie);
      });
      return errRes;
    }

    const { prefix_key, max, window } = getRateLimitConfig(pathname);
    const limiter = getLimiter(prefix_key, max, window);
    const identifier = `${requestIp ?? 'dev-local'}:${pathname}`;
    const result = await limiter.limit(identifier);

    if (!result.success) {
      const retryAfter = Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1);
      const errRes = NextResponse.json(
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
      response.headers.getSetCookie().forEach((cookie) => {
        errRes.headers.append('Set-Cookie', cookie);
      });
      return errRes;
    }

    // 5. Inject CORS + rate limit headers into the success response
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
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
