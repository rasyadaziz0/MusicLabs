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
  const album = searchParams.get('album');
  const durationParam = searchParams.get('duration');

  if (!title || !artist) {
    return NextResponse.json({ error: 'Butuh judul dan artis' }, { status: 400 });
  }

  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanAlbum = album ? album.replace(/\(.*?\)|\[.*?\]/g, '').trim() : '';

  try {
    // 1. Coba /api/get dulu kalau ada durasi
    if (durationParam) {
      const getParams = new URLSearchParams({
        track_name: cleanTitle,
        artist_name: cleanArtist,
        duration: durationParam,
      });
      if (cleanAlbum) getParams.append('album_name', cleanAlbum);

      const getUrl = `https://lrclib.net/api/get?${getParams.toString()}`;
      const getRes = await fetch(getUrl);
      
      if (getRes.ok) {
        const getData = (await getRes.json()) as LrcLibTrack;
        if (getData.syncedLyrics) {
          return NextResponse.json({ synced: true, lyrics: getData.syncedLyrics });
        } else if (getData.plainLyrics) {
          return NextResponse.json({ synced: false, lyrics: getData.plainLyrics });
        }
      }
    }

    // 2. Fallback ke /api/search kalau /api/get gagal atau gak dapet synced lyrics
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = (await searchRes.json()) as LrcLibTrack[];

    if (searchData && searchData.length > 0) {
      let bestMatch: LrcLibTrack | undefined;
      const syncedTracks = searchData.filter(
        (track) => track.syncedLyrics !== null && track.syncedLyrics !== undefined && track.syncedLyrics !== ''
      );

      if (syncedTracks.length > 0) {
        if (durationParam) {
          const targetDuration = Number.parseInt(durationParam, 10);
          if (Number.isFinite(targetDuration)) {
            let closestDiff = Infinity;
            for (const track of syncedTracks) {
              const trackDuration = Number(track.duration);
              if (!Number.isFinite(trackDuration)) continue;
              const diff = Math.abs(trackDuration - targetDuration);
              if (diff <= 5 && diff < closestDiff) {
                closestDiff = diff;
                bestMatch = track;
              }
            }
          }
        }
      }

      if (bestMatch?.syncedLyrics) {
        return NextResponse.json({ synced: true, lyrics: bestMatch.syncedLyrics });
      }

      if (searchData[0]?.plainLyrics) {
        return NextResponse.json({ synced: false, lyrics: searchData[0].plainLyrics });
      }
    }

    // 3. Fallback ke lyrics.ovh kalau lrclib tetep gak nemu
    const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
    const ovhRes = await fetch(ovhUrl);
    
    if (ovhRes.ok) {
      const ovhData = await ovhRes.json();
      if (ovhData.lyrics) {
        return NextResponse.json({ synced: false, lyrics: ovhData.lyrics });
      }
    }

    return NextResponse.json({ error: 'Lirik gak ketemu' }, { status: 404 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal nyari lirik' }, { status: 500 });
  }
}
