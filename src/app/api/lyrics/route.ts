import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface LrcLibTrack {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackName = searchParams.get('track_name')?.trim();
  const artistName = searchParams.get('artist_name')?.trim();
  const durationParam = searchParams.get('duration')?.trim();
  const duration = durationParam ? Number(durationParam) : NaN;

  if (!trackName || !artistName || !Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: 'Butuh track_name, artist_name, dan duration valid' }, { status: 400 });
  }

  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}&duration=${Math.round(duration)}`;
    const res = await fetch(url);

    if (res.status === 404) {
      return NextResponse.json({ error: 'Lirik gak ketemu' }, { status: 404 });
    }

    if (!res.ok) {
      throw new Error(`LRCLIB request failed with status ${res.status}`);
    }

    const data = (await res.json()) as LrcLibTrack;
    if (typeof data.syncedLyrics === 'string' && data.syncedLyrics.trim().length > 0) {
      return NextResponse.json({
        synced: true,
        lyrics: data.syncedLyrics,
      });
    }

    if (typeof data.plainLyrics === 'string' && data.plainLyrics.trim().length > 0) {
      return NextResponse.json({
        synced: false,
        lyrics: data.plainLyrics,
      });
    }

    return NextResponse.json({ error: 'Lirik gak ketemu' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Gagal nyari lirik' }, { status: 500 });
  }
}
