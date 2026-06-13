import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type RateLimitConfig = {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimiterInstance = {
  key: string;
  limiter: Ratelimit;
};

const GLOBAL_STORE_KEY = '__ACADMUSIC_RATE_LIMIT_STORE__';
const GLOBAL_LIMITER_STORE_KEY = '__ACADMUSIC_RATE_LIMITERS__';
const store = getStore();
const limiterStore = getLimiterStore();

function getStore(): Map<string, Bucket> {
  const globalObj = globalThis as typeof globalThis & {
    [GLOBAL_STORE_KEY]?: Map<string, Bucket>;
  };

  if (!globalObj[GLOBAL_STORE_KEY]) {
    globalObj[GLOBAL_STORE_KEY] = new Map<string, Bucket>();
  }

  return globalObj[GLOBAL_STORE_KEY]!;
}

function getLimiterStore(): Map<string, RateLimiterInstance> {
  const globalObj = globalThis as typeof globalThis & {
    [GLOBAL_LIMITER_STORE_KEY]?: Map<string, RateLimiterInstance>;
  };

  if (!globalObj[GLOBAL_LIMITER_STORE_KEY]) {
    globalObj[GLOBAL_LIMITER_STORE_KEY] = new Map<string, RateLimiterInstance>();
  }

  return globalObj[GLOBAL_LIMITER_STORE_KEY]!;
}

function hasUpstashConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function shouldUseLocalFallback() {
  return process.env.NODE_ENV !== 'production';
}

export function getRequestIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-vercel-forwarded-for') ||
    'unknown'
  );
}

function checkLocalRateLimit(
  identifier: string,
  { limit, windowMs, keyPrefix = 'api' }: RateLimitConfig
): RateLimitResult {
  // During local development, increase the limit significantly to prevent HMR and fast refreshes from exhausting it
  const actualLimit = process.env.NODE_ENV === 'development' ? limit * 10 : limit;

  const now = Date.now();
  const key = `${keyPrefix}:${identifier}`;
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: actualLimit,
      remaining: Math.max(actualLimit - 1, 0),
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(actualLimit - existing.count, 0);

  return {
    allowed: existing.count <= actualLimit,
    limit: actualLimit,
    remaining,
    resetInSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
  };
}

function getRatelimiter({ limit, windowMs, keyPrefix = 'api' }: RateLimitConfig): Ratelimit {
  const windowSeconds = Math.max(Math.ceil(windowMs / 1000), 1);
  const limiterKey = `${keyPrefix}:${limit}:${windowSeconds}`;
  const existing = limiterStore.get(limiterKey);

  if (existing) return existing.limiter;

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: `acadmusic:${keyPrefix}`,
  });

  limiterStore.set(limiterKey, { key: limiterKey, limiter });
  return limiter;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit } = config;

  if (hasUpstashConfig()) {
    const limiter = getRatelimiter(config);
    const result = await limiter.limit(identifier);
    const resetInSeconds = Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1);

    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetInSeconds,
    };
  }

  if (shouldUseLocalFallback()) {
    return checkLocalRateLimit(identifier, config);
  }

  // Production without Upstash = all requests blocked (fail-closed)
  console.error(
    '[RATE_LIMIT] CRITICAL: UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN not set in production. All rate-limited requests will be BLOCKED.'
  );

  return {
    allowed: false,
    limit,
    remaining: 0,
    resetInSeconds: 60,
  };
}
