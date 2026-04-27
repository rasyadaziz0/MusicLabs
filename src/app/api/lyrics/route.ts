import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface LrcLibTrack {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title');
  const artist = searchParams.get('artist');
  const durationParam = searchParams.get('duration');

  if (!title || !artist) {
    return NextResponse.json({ error: 'Butuh judul dan artis' }, { status: 400 });
  }

  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').trim();

  try {
    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const res = await fetch(url);
    const data = (await res.json()) as LrcLibTrack[];

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Lirik gak ketemu' }, { status: 404 });
    }

    let bestMatch: LrcLibTrack | undefined;

    // Filter hanya track yang punya synced lyrics
    const syncedTracks = data.filter(
      (track) => track.syncedLyrics !== null && track.syncedLyrics !== undefined && track.syncedLyrics !== ''
    );

    if (syncedTracks.length > 0) {
      if (durationParam) {
        const targetDuration = Number.parseInt(durationParam, 10);
        if (Number.isFinite(targetDuration)) {
          // Cari yang durasinya paling dekat dengan target (bukan sekedar ±3s first match)
          let closestDiff = Infinity;
          for (const track of syncedTracks) {
            const trackDuration = Number(track.duration);
            if (!Number.isFinite(trackDuration)) continue;
            const diff = Math.abs(trackDuration - targetDuration);
            // Hanya accept kalau dalam ±5s, prioritas yang paling dekat
            if (diff <= 5 && diff < closestDiff) {
              closestDiff = diff;
              bestMatch = track;
            }
          }
        }
      }

      // Kalau nggak ada duration match yang cukup dekat, skip daripada kasih lirik yang salah
      // (jangan fallback ke random syncedLyrics tanpa mempertimbangkan durasi)
    }

    if (bestMatch?.syncedLyrics) {
      return NextResponse.json({
        synced: true,
        lyrics: bestMatch.syncedLyrics,
      });
    }

    if (data[0]?.plainLyrics) {
      return NextResponse.json({
        synced: false,
        lyrics: data[0].plainLyrics,
      });
    }

    return NextResponse.json({ error: 'Lirik gak ketemu' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Gagal nyari lirik' }, { status: 500 });
  }
}
