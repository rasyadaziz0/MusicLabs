import { NextRequest } from 'next/server';

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

const GLOBAL_STORE_KEY = '__MUSICLABS_RATE_LIMIT_STORE__';
const store = getStore();

function getStore(): Map<string, Bucket> {
  const globalObj = globalThis as typeof globalThis & {
    [GLOBAL_STORE_KEY]?: Map<string, Bucket>;
  };

  if (!globalObj[GLOBAL_STORE_KEY]) {
    globalObj[GLOBAL_STORE_KEY] = new Map<string, Bucket>();
  }

  return globalObj[GLOBAL_STORE_KEY]!;
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

export function checkRateLimit(
  identifier: string,
  { limit, windowMs, keyPrefix = 'api' }: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${keyPrefix}:${identifier}`;
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - 1, 0),
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const remaining = Math.max(limit - existing.count, 0);

  return {
    allowed: existing.count <= limit,
    limit,
    remaining,
    resetInSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
  };
}
