import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRequestIp } from '@/lib/server/rateLimit';
export const runtime = 'edge';

interface LrcLibTrack {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | string | null;
}

function normKey(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const userLimiter = await checkRateLimit(ip, {
    limit: 60,
    windowMs: 60_000,
    keyPrefix: 'lyrics:ip',
  });

  if (!userLimiter.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(userLimiter.resetInSeconds) },
      }
    );
  }

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
  const primaryArtist = cleanArtist.split(/[,&/]| feat\.? | ft\.? /i)[0].trim();

  try {
    let fallbackPlainLyrics: string | null | undefined = null;

    // 1. Coba Netease (music.163.com) dulu karena punya YRC (karaoke lyrics)
    try {
      const fetchNeteaseLrc = async (searchQuery: string, searchTitle: string) => {
        const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(searchQuery)}&type=1&limit=10`;
        const res = await fetch(url, {
          headers: { 'Referer': 'https://music.163.com' },
          signal: AbortSignal.timeout(15000),
          next: { revalidate: 86400 }
        });
        const data = await res.json();

        if (data?.result?.songs?.length > 0) {
          const songs = data.result.songs;
          const normArtist = normKey(cleanArtist);
          const normTitle = normKey(searchTitle);

          let bestSong;
          let isDurationConfirmed = false;

          if (durationParam) {
            const targetMs = Number.parseInt(durationParam, 10) * 1000;
            if (Number.isFinite(targetMs)) {
              let closestDiff = Infinity;
              for (const s of songs) {
                const trackMs = s.duration || s.dt || 0;
                if (!trackMs) continue;
                const diff = Math.abs(trackMs - targetMs);
                const artistMatch = s.artists?.some((a: any) => normKey(a.name) === normArtist);

                // Check if duration is within 3 seconds and artist matches
                if (diff < closestDiff && diff < 3000 && artistMatch) {
                  closestDiff = diff;
                  bestSong = s;
                  isDurationConfirmed = true;
                }
              }
            }
          }

          if (!bestSong) {
            bestSong = songs.find((s: any) => {
              const titleMatch = normKey(s.name).includes(normTitle) || normTitle.includes(normKey(s.name));
              const artistMatch = s.artists?.some((a: any) => normKey(a.name).includes(normArtist) || normArtist.includes(normKey(a.name)));
              return titleMatch && artistMatch;
            });
          }

          if (bestSong?.id) {
            const lyricUrl = `https://music.163.com/api/song/lyric/v1?id=${bestSong.id}&lv=-1&kv=-1&tv=-1&yv=-1`;
            const lyricRes = await fetch(lyricUrl, {
              headers: { 'Referer': 'https://music.163.com' },
              signal: AbortSignal.timeout(10000),
              next: { revalidate: 86400 }
            });
            const lyricData = await lyricRes.json();

            // Validasi YRC: pastiin isinya ada tuple (start,duration,unknown) dan minimal bbrp baris
            const yrc = lyricData?.yrc?.lyric;
            if (yrc) {
              const wordLines = yrc.split('\n').filter((l: string) => /\(\d+,\d+,\d+\)/.test(l));
              if (wordLines.length >= 3) {
                return { type: 'yrc', lyrics: yrc };
              }
            }

            const lrc = lyricData?.lrc?.lyric;
            if (lrc) {
              const lines = lrc.split('\n');
              const timestampedLines = lines.filter((line: string) => {
                const match = line.match(/\[\d{2}:\d{2}\.\d{2,3}\]/);
                const content = line.replace(/\[.*?\]/g, '').trim();
                return match && content.length > 0;
              });

              if (timestampedLines.length >= 3) {
                return { type: 'lrc', lyrics: lrc };
              }
            }
          }
        }
        return null;
      };

      let syncedLrc = await fetchNeteaseLrc(cleanTitle + ' ' + cleanArtist, cleanTitle);
      if (!syncedLrc && primaryArtist !== cleanArtist) {
        syncedLrc = await fetchNeteaseLrc(cleanTitle + ' ' + primaryArtist, cleanTitle);
      }

      // 1.5 Fallback ke iTunes untuk terjemahan judul
      if (!syncedLrc) {
        try {
          let itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist + ' ' + cleanTitle)}&entity=song&limit=1`;
          let itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
          let itunesData = await itunesRes.json();

          if (!itunesData.results?.length && primaryArtist !== cleanArtist) {
            itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(primaryArtist + ' ' + cleanTitle)}&entity=song&limit=1`;
            itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
            itunesData = await itunesRes.json();
          }

          const fallbackTrackName = itunesData.results?.[0]?.trackName;

          if (fallbackTrackName && normKey(fallbackTrackName) !== normKey(cleanTitle)) {
            syncedLrc = await fetchNeteaseLrc(fallbackTrackName + ' ' + cleanArtist, fallbackTrackName);
          }
        } catch (e) {
          console.error('iTunes fallback failed:', e);
        }
      }

      if (syncedLrc) {
        return NextResponse.json({ synced: true, type: syncedLrc.type, lyrics: syncedLrc.lyrics }, {
          headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
        });
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        console.warn('Netease search timed out (>10s)');
      } else {
        console.error('Netease search failed:', err);
      }
    }

    try {
      // 2. Fallback ke lrclib.net /api/get kalau Netease gagal
      if (durationParam) {
        const getParams = new URLSearchParams({
          track_name: cleanTitle,
          artist_name: cleanArtist,
          duration: durationParam,
        });
        if (cleanAlbum) getParams.append('album_name', cleanAlbum);

        let getUrl = `https://lrclib.net/api/get?${getParams.toString()}`;
        let getRes = await fetch(getUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });

        if (!getRes.ok && primaryArtist !== cleanArtist) {
          getParams.set('artist_name', primaryArtist);
          getUrl = `https://lrclib.net/api/get?${getParams.toString()}`;
          getRes = await fetch(getUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
        }

        if (getRes.ok) {
          const getData = (await getRes.json()) as LrcLibTrack;
          if (getData.syncedLyrics) {
            return NextResponse.json({ synced: true, type: 'lrc', lyrics: getData.syncedLyrics }, {
              headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
            });
          } else if (getData.plainLyrics) {
            fallbackPlainLyrics = getData.plainLyrics;
          }
        }
      }

      // 3. Fallback ke lrclib.net /api/search kalau /api/get gagal
      let searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      let searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
      let searchData = (await searchRes.json()) as LrcLibTrack[];

      if ((!searchData || searchData.length === 0) && primaryArtist !== cleanArtist) {
        searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`;
        searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
        searchData = (await searchRes.json()) as LrcLibTrack[];
      }

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
                if (diff < closestDiff) {
                  closestDiff = diff;
                  bestMatch = track;
                }
              }
            }
          }
          if (!bestMatch) {
            // Find the best match where artist matches
            bestMatch = syncedTracks.find((track: any) => {
              const trackArtist = normKey(track.artistName || '');
              const targetArtist = normKey(cleanArtist);
              const targetPrimaryArtist = normKey(primaryArtist);
              return trackArtist.includes(targetArtist) || targetArtist.includes(trackArtist) || trackArtist.includes(targetPrimaryArtist) || targetPrimaryArtist.includes(trackArtist);
            });
          }

          // If still no match and we're desperate, we only take it if the title is an exact match
          if (!bestMatch) {
            bestMatch = syncedTracks.find((track: any) => normKey(track.trackName || '') === normKey(cleanTitle));
          }
        }

        fallbackPlainLyrics = fallbackPlainLyrics || searchData[0]?.plainLyrics;
      }

      if (bestMatch?.syncedLyrics) {
        return NextResponse.json({ synced: true, type: 'lrc', lyrics: bestMatch.syncedLyrics }, {
          headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
        });
      }

      if (fallbackPlainLyrics) {
        return NextResponse.json({ synced: false, type: 'lrc', lyrics: fallbackPlainLyrics }, {
          headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
        });
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        console.warn('lrclib search timed out (>20s)');
      } else {
        console.error('lrclib search failed:', err);
      }
    }

    try {
      // 4. Fallback ke lyrics.ovh kalau lrclib tetep gak nemu
      let ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
      let ovhRes = await fetch(ovhUrl, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });

      if (!ovhRes.ok && primaryArtist !== cleanArtist) {
        ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(primaryArtist)}/${encodeURIComponent(cleanTitle)}`;
        ovhRes = await fetch(ovhUrl, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });
      }

      if (ovhRes.ok) {
        const ovhData = await ovhRes.json();
        if (ovhData.lyrics) {
          return NextResponse.json({ synced: false, type: 'lrc', lyrics: ovhData.lyrics }, {
            headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        console.warn('lyrics.ovh search timed out (>4s)');
      } else {
        console.error('lyrics.ovh search failed:', err);
      }
    }
    return NextResponse.json({ error: 'Lirik gak ketemu' }, { status: 404 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Gagal nyari lirik' }, { status: 500 });
  }
}
