import { NextRequest, NextResponse } from 'next/server';
import { searchITunesTracks, searchITunesArtists } from '@/lib/server/itunesApi';
import { checkRateLimit, getRequestIp } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const limiter = await checkRateLimit(ip, {
    limit: 40,
    windowMs: 60_000,
    keyPrefix: 'search:combined',
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

  const query = request.nextUrl.searchParams.get('q') || request.nextUrl.searchParams.get('query');

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query kosong.' }, { status: 400 });
  }

  try {
    const [songs, artists] = await Promise.all([
      searchITunesTracks(query.trim(), 15),
      searchITunesArtists(query.trim(), 5),
    ]);

    return NextResponse.json(
      {
        data: {
          songs,
          artists,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': String(limiter.limit),
          'X-RateLimit-Remaining': String(limiter.remaining),
          'X-RateLimit-Reset': String(limiter.resetInSeconds),
        },
      }
    );
  } catch (error) {
    console.error('iTunes combined search failed:', error);
    return NextResponse.json({ error: 'Gagal nyari' }, { status: 500 });
  }
}
