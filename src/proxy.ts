import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { enforceCors } from '@/lib/server/cors';

// ─── Rate limit buckets per route category ───────────────────────────────────
// Tighter limit for expensive/quota-bound endpoints, looser for general reads.
const RATE_LIMIT_CONFIGS: { prefix: string; prefix_key: string; max: number; window: string }[] = [
  {
    prefix: '/api/audio/resolve',
    prefix_key: 'musiclabs:edge:audio-resolve',
    max: 10,
    window: '1 m',
  },
  {
    prefix: '/api/search',
    prefix_key: 'musiclabs:edge:search',
    max: 30,
    window: '1 m',
  },
];

// Fallback config — applied to every other /api/* route
const DEFAULT_RATE_LIMIT = {
  prefix_key: 'musiclabs:edge:general',
  max: 60,
  window: '1 m',
};

// ─── Limiter cache (one instance per prefix_key to avoid re-instantiation) ───
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

// ─── Auth-required routes (protect expensive / quota-bound endpoints) ────────
const AUTH_REQUIRED_PREFIXES = [
  '/api/audio/',      // YouTube resolve/streaming — expensive, burns API quota
  '/api/import/',     // Spotify import — requires user session
];

function routeRequiresAuth(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasAuthCookie(request: NextRequest) {
  // Supabase stores auth in cookies; check for auth-token cookie presence
  const cookies = request.cookies.getAll();
  return cookies.some(
    (c) => c.name.includes('auth-token') || c.name.includes('sb-') 
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getRequestIp(request: NextRequest): string | null {
  // Prefer Vercel-set header (cannot be spoofed by client)
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0]?.trim() || null;

  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0]?.trim() || null;

  const fallbackIp =
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip');

  return fallbackIp?.trim() || null;
}

function hasUpstashConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// ─── Main proxy handler ───────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CORS — semua route /api/* WAJIB lewat guard ini, bukan cuma yang "protected"
  const cors = enforceCors(request, {
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  if (cors.response) return cors.response;

  // 1b. Auth gate — block unauthenticated access to expensive/sensitive routes
  if (routeRequiresAuth(pathname) && !hasAuthCookie(request)) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401, headers: cors.corsHeaders }
    );
  }

  // 2. Skip rate limiter jika Upstash belum dikonfigurasi (dev mode toleran)
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

  // 3. Wajib ada IP di production
  const requestIp = getRequestIp(request);
  if (!requestIp && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden: missing client IP' }, { status: 403 });
  }

  // 4. Pilih bucket rate limit berdasarkan route
  const { prefix_key, max, window } = getRateLimitConfig(pathname);
  const limiter = getLimiter(prefix_key, max, window);
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

  // 5. Inject CORS + rate limit headers ke response
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
