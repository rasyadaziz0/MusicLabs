import { NextRequest, NextResponse } from 'next/server';
import { searchDeezerTracks } from '@/lib/server/deezerApi';
import { checkRateLimit, getRequestIp } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const limiter = checkRateLimit(ip, {
    limit: 60,
    windowMs: 60_000,
    keyPrefix: 'search:songs',
  });

  if (!limiter.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait before trying again.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(limiter.resetInSeconds),
          'X-RateLimit-Limit': String(limiter.limit),
          'X-RateLimit-Remaining': String(limiter.remaining),
          'X-RateLimit-Reset': String(limiter.resetInSeconds),
        },
      }
    );
  }

  const query = request.nextUrl.searchParams.get('query') || request.nextUrl.searchParams.get('q');
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  if (!query?.trim()) {
    return NextResponse.json({ data: { results: [] } });
  }

  try {
    const songs = await searchDeezerTracks(query.trim(), limit);
    return NextResponse.json(
      { data: { results: songs } },
      {
        headers: {
          'X-RateLimit-Limit': String(limiter.limit),
          'X-RateLimit-Remaining': String(limiter.remaining),
          'X-RateLimit-Reset': String(limiter.resetInSeconds),
        },
      }
    );
  } catch (error) {
    console.error('Deezer search/songs failed:', error);
    return NextResponse.json({ data: { results: [] } }, { status: 500 });
  }
}
