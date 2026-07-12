import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRequestIp } from '@/lib/server/rateLimit';
import { LyricsService } from '@/lib/server/LyricsService';

export const runtime = 'edge';

/**
 * GET /api/lyrics?title=...&artist=...&album=...&duration=...
 *
 * Thin route handler — all business logic lives in LyricsService.
 */
export async function GET(request: NextRequest) {
  // ── Rate limiting ──
  const ip = getRequestIp(request);
  const limiter = await checkRateLimit(ip, {
    limit: 60,
    windowMs: 60_000,
    keyPrefix: 'lyrics:ip',
  });

  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(limiter.resetInSeconds) },
      }
    );
  }

  // ── Parse params ──
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');
  const album = searchParams.get('album') || undefined;
  const durationParam = searchParams.get('duration');

  if (!title || !artist) {
    return NextResponse.json({ error: 'Butuh judul dan artis' }, { status: 400 });
  }

  const durationSec = durationParam ? Number.parseInt(durationParam, 10) : null;

  // ── Delegate to service ──
  try {
    const service = LyricsService.getInstance();
    const result = await service.findLyrics({
      title,
      artist,
      album,
      durationSec,
    });

    if (!result) {
      return NextResponse.json({ error: 'Lirik gak ketemu' }, { status: 404 });
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  } catch (err) {
    console.error('Lyrics route error:', err);
    return NextResponse.json({ error: 'Gagal nyari lirik' }, { status: 500 });
  }
}
