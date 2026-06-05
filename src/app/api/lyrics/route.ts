import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface LrcLibTrack {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | string | null;
}

function normKey(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
    let fallbackPlainLyrics: string | null | undefined = null;

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
          // Keep as fallback instead of returning immediately, so we can try searching and Netease for synced
          fallbackPlainLyrics = getData.plainLyrics;
        }
      }
    }

    // 2. Fallback ke /api/search kalau /api/get gagal atau gak dapet synced lyrics
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = (await searchRes.json()) as LrcLibTrack[];

    let bestMatch: LrcLibTrack | undefined;
    if (searchData && searchData.length > 0) {
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
        if (!bestMatch) {
          bestMatch = syncedTracks[0];
        }
      }

      fallbackPlainLyrics = fallbackPlainLyrics || searchData[0]?.plainLyrics;
    }

    if (bestMatch?.syncedLyrics) {
      return NextResponse.json({ synced: true, lyrics: bestMatch.syncedLyrics });
    }

      // 3. Fallback ke Netease kalau lrclib gak dapet synced lyrics
      try {
        const fetchNeteaseLrc = async (searchQuery: string, searchTitle: string) => {
          const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(searchQuery)}&type=1&limit=10`;
          const res = await fetch(url, { headers: { 'Referer': 'https://music.163.com' } });
          const data = await res.json();
          
          if (data?.result?.songs?.length > 0) {
            const songs = data.result.songs;
            const normArtist = normKey(cleanArtist);
            const normTitle = normKey(searchTitle);
            
            let bestSong = songs.find((s: any) => s.artists?.some((a: any) => normKey(a.name) === normArtist));
            if (!bestSong) bestSong = songs.find((s: any) => normKey(s.name) === normTitle);
            
            if (bestSong?.id) {
              const lyricUrl = `https://music.163.com/api/song/lyric?id=${bestSong.id}&lv=1&kv=1&tv=-1`;
              const lyricRes = await fetch(lyricUrl, { headers: { 'Referer': 'https://music.163.com' } });
              const lyricData = await lyricRes.json();
              const lrc = lyricData?.lrc?.lyric;
              
              if (lrc) {
                const lines = lrc.split('\n');
                const timestampedLines = lines.filter((line: string) => {
                  const match = line.match(/\[\d{2}:\d{2}\.\d{2,3}\]/);
                  const content = line.replace(/\[.*?\]/g, '').trim();
                  return match && content.length > 0;
                });
                
                if (timestampedLines.length >= 3) return lrc;
              }
            }
          }
          return null;
        };

        let syncedLrc = await fetchNeteaseLrc(cleanTitle + ' ' + cleanArtist, cleanTitle);
        
        // 3.5 Fallback ke iTunes JP untuk terjemahan judul (mengatasi judul Inggris dari YouTube Music yang aslinya bahasa Jepang)
        if (!syncedLrc) {
          try {
            const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}&country=jp&entity=song&limit=1`;
            const itunesRes = await fetch(itunesUrl);
            const itunesData = await itunesRes.json();
            const jpTrackName = itunesData.results?.[0]?.trackName;
            
            if (jpTrackName && normKey(jpTrackName) !== normKey(cleanTitle)) {
              syncedLrc = await fetchNeteaseLrc(jpTrackName + ' ' + cleanArtist, jpTrackName);
            }
          } catch (e) {
            console.error('iTunes JP fallback failed:', e);
          }
        }

        if (syncedLrc) {
          return NextResponse.json({ synced: true, lyrics: syncedLrc });
        }
      } catch (err) {
        console.error('Netease search failed:', err);
      }

      // Kalau Netease juga gak ada synced lyrics, balikin plain lyrics dari lrclib kalau ada
      if (fallbackPlainLyrics) {
        return NextResponse.json({ synced: false, lyrics: fallbackPlainLyrics });
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
