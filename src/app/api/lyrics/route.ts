import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRequestIp } from '@/lib/server/rateLimit';
export const runtime = 'edge';

interface LrcLibTrack {
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  duration?: number | string | null;
  trackName?: string;
  artistName?: string;
}

// ── Normalization helpers ───────────────────────────────────────────

function normKey(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Remove noise words/brackets that confuse matching */
function cleanForMatch(str: string): string {
  return str
    .replace(/\(.*?\)|\[.*?\]/g, '')           // Remove (Deluxe), [Remastered], etc
    .replace(/\s*[-–—]\s*(single|ep)\s*$/i, '') // Remove "- Single", "- EP"
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split string into a Set of lowercase words for Jaccard comparison */
function wordSet(str: string): Set<string> {
  const normalized = normKey(str);
  // Split on non-letter/non-digit chars, filter empties
  return new Set(
    normalized.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 0)
  );
}

/**
 * Jaccard similarity: |A ∩ B| / |A ∪ B|
 * Returns 0..1 where 1 = identical word sets
 */
function jaccardSimilarity(a: string, b: string): number {
  const setA = wordSet(a);
  const setB = wordSet(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Check if all significant words of the shorter string appear in the longer one.
 * This handles cases like:
 *   query: "Love Story"  vs  result: "Love Story (Taylor's Version)"
 * where Jaccard would be low but it's clearly the right song.
 */
function containsAllWords(shorter: string, longer: string): boolean {
  const shortWords = wordSet(shorter);
  const longWords = wordSet(longer);
  if (shortWords.size === 0) return false;
  let matches = 0;
  for (const word of shortWords) {
    if (longWords.has(word)) matches++;
  }
  return matches / shortWords.size >= 0.9; // Allow 1 missing word for long titles
}

/**
 * Compute a 0..100 confidence score for a candidate song match.
 */
function computeMatchScore(
  candidateTitle: string,
  candidateArtist: string,
  candidateDurationMs: number | null,
  targetTitle: string,
  targetArtist: string,
  targetDurationSec: number | null,
): number {
  let score = 0;

  // ── Title scoring (0-50) ──
  const titleJaccard = jaccardSimilarity(candidateTitle, targetTitle);
  score += titleJaccard * 40;

  // Bonus if one fully contains the other's words
  if (titleJaccard < 1 && (
    containsAllWords(targetTitle, candidateTitle) ||
    containsAllWords(candidateTitle, targetTitle)
  )) {
    score += 10;
  }

  // ── Artist scoring (0-35) ──
  const artistJaccard = jaccardSimilarity(candidateArtist, targetArtist);
  score += artistJaccard * 25;

  // Also check if the primary artist (first name) matches
  const candidatePrimary = candidateArtist.split(/[,&/]| feat\.? | ft\.? /i)[0].trim();
  const targetPrimary = targetArtist.split(/[,&/]| feat\.? | ft\.? /i)[0].trim();
  const primaryJaccard = jaccardSimilarity(candidatePrimary, targetPrimary);
  score += primaryJaccard * 10;

  // ── Duration scoring (0-15) ──
  if (candidateDurationMs != null && targetDurationSec != null && targetDurationSec > 0) {
    const candidateSec = candidateDurationMs / 1000;
    const diff = Math.abs(candidateSec - targetDurationSec);
    if (diff <= 2) score += 15;       // Near-exact match
    else if (diff <= 5) score += 10;  // Close enough
    else if (diff <= 10) score += 5;  // Acceptable
    else if (diff > 30) score -= 10;  // Very different — penalize
  }

  return Math.max(0, Math.min(100, score));
}

// Minimum confidence to accept a lyrics match
const MIN_CONFIDENCE_SYNCED = 45;  // Higher bar for synced (wrong synced lyrics is very noticeable)
const MIN_CONFIDENCE_PLAIN = 35;   // Lower bar for plain text

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

  const cleanTitle = cleanForMatch(title);
  const cleanArtist = cleanForMatch(artist);
  const cleanAlbum = album ? cleanForMatch(album) : '';
  const primaryArtist = cleanArtist.split(/[,&/]| feat\.? | ft\.? /i)[0].trim();
  const targetDurationSec = durationParam ? Number.parseInt(durationParam, 10) : null;

  try {
    let fallbackPlainLyrics: string | null | undefined = null;
    let fallbackPlainConfidence = 0;

    // ═══════════════════════════════════════════════════════════════
    // 1. Netease (music.163.com) — best source for YRC karaoke lyrics
    // ═══════════════════════════════════════════════════════════════
    try {
      const fetchNeteaseLrc = async (searchQuery: string, searchTitle: string) => {
        const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(searchQuery)}&type=1&limit=15`;
        const res = await fetch(url, {
          headers: { 'Referer': 'https://music.163.com' },
          signal: AbortSignal.timeout(15000),
          next: { revalidate: 86400 }
        });
        const data = await res.json();

        if (!data?.result?.songs?.length) return null;

        const songs = data.result.songs;
        let bestSong: any = null;
        let bestScore = 0;

        for (const s of songs) {
          const candidateTitle = s.name || '';
          const candidateArtist = (s.artists || []).map((a: any) => a.name).join(', ');
          const candidateDurationMs = s.duration || s.dt || null;

          const score = computeMatchScore(
            candidateTitle,
            candidateArtist,
            candidateDurationMs,
            searchTitle,
            cleanArtist,
            targetDurationSec,
          );

          if (score > bestScore) {
            bestScore = score;
            bestSong = s;
          }
        }

        // Reject if confidence is too low
        if (!bestSong || bestScore < MIN_CONFIDENCE_SYNCED) {
          return null;
        }

        // Fetch lyrics for the best match
        const lyricUrl = `https://music.163.com/api/song/lyric/v1?id=${bestSong.id}&lv=-1&kv=-1&tv=-1&yv=-1`;
        const lyricRes = await fetch(lyricUrl, {
          headers: { 'Referer': 'https://music.163.com' },
          signal: AbortSignal.timeout(10000),
          next: { revalidate: 86400 }
        });
        const lyricData = await lyricRes.json();

        // Try YRC (karaoke) first
        const yrc = lyricData?.yrc?.lyric;
        if (yrc) {
          const wordLines = yrc.split('\n').filter((l: string) => /\(\d+,\d+,\d+\)/.test(l));
          if (wordLines.length >= 3) {
            return { type: 'yrc', lyrics: yrc, confidence: bestScore };
          }
        }

        // Try standard LRC
        const lrc = lyricData?.lrc?.lyric;
        if (lrc) {
          const lines = lrc.split('\n');
          const timestampedLines = lines.filter((line: string) => {
            const match = line.match(/\[\d{2}:\d{2}\.\d{2,3}\]/);
            const content = line.replace(/\[.*?\]/g, '').trim();
            return match && content.length > 0;
          });

          if (timestampedLines.length >= 3) {
            return { type: 'lrc', lyrics: lrc, confidence: bestScore };
          }
        }

        return null;
      };

      // Try with full title + artist
      let syncedLrc = await fetchNeteaseLrc(cleanTitle + ' ' + cleanArtist, cleanTitle);

      // Retry with primary artist only
      if (!syncedLrc && primaryArtist !== cleanArtist) {
        syncedLrc = await fetchNeteaseLrc(cleanTitle + ' ' + primaryArtist, cleanTitle);
      }

      // 1.5 Fallback: try iTunes for translated/alternate title
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

          if (fallbackTrackName && normKey(cleanForMatch(fallbackTrackName)) !== normKey(cleanTitle)) {
            syncedLrc = await fetchNeteaseLrc(fallbackTrackName + ' ' + cleanArtist, fallbackTrackName);
          }
        } catch (e) {
          console.error('iTunes fallback failed:', e);
        }
      }

      if (syncedLrc) {
        if (syncedLrc.type === 'yrc') {
          // YRC = real per-word karaoke timestamps → best quality, return immediately
          return NextResponse.json({ synced: true, type: 'yrc', lyrics: syncedLrc.lyrics, source: 'netease' }, {
            headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
          });
        }
        // Netease LRC (no YRC available) → save as fallback, try LRClib first
        // LRClib may have better-timed synced lyrics for this song
        if (!fallbackPlainLyrics) {
          fallbackPlainLyrics = syncedLrc.lyrics;
          fallbackPlainConfidence = syncedLrc.confidence ?? 50;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        console.warn('Netease search timed out (>15s)');
      } else {
        console.error('Netease search failed:', err);
      }
    }
    const neteaseLrcFallback = fallbackPlainLyrics;

    // ═══════════════════════════════════════════════════════════════
    // 2. LRClib.net /api/get (exact match by title+artist+duration)
    // ═══════════════════════════════════════════════════════════════
    try {
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
            // /api/get is exact match by LRClib, so trust it
            return NextResponse.json({ synced: true, type: 'lrc', lyrics: getData.syncedLyrics, source: 'lrclib' }, {
              headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
            });
          } else if (getData.plainLyrics) {
            fallbackPlainLyrics = getData.plainLyrics;
            fallbackPlainConfidence = 80; // /api/get is exact, high confidence
          }
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 3. LRClib.net /api/search (fuzzy — needs careful validation)
      // ═══════════════════════════════════════════════════════════════
      let searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      let searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
      let searchData = (await searchRes.json()) as LrcLibTrack[];

      if ((!searchData || searchData.length === 0) && primaryArtist !== cleanArtist) {
        searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`;
        searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15000), next: { revalidate: 86400 } });
        searchData = (await searchRes.json()) as LrcLibTrack[];
      }

      if (searchData && searchData.length > 0) {
        // Score each candidate properly
        const syncedCandidates = searchData
          .filter(track => track.syncedLyrics)
          .map(track => {
            const candidateDurationMs = track.duration != null
              ? Number(track.duration) * 1000  // LRClib duration is in seconds
              : null;

            const score = computeMatchScore(
              track.trackName || '',
              track.artistName || '',
              candidateDurationMs,
              cleanTitle,
              cleanArtist,
              targetDurationSec,
            );

            return { track, score };
          })
          .filter(entry => entry.score >= MIN_CONFIDENCE_SYNCED)
          .sort((a, b) => b.score - a.score);

        if (syncedCandidates.length > 0) {
          return NextResponse.json({ synced: true, type: 'lrc', lyrics: syncedCandidates[0].track.syncedLyrics, source: 'lrclib' }, {
            headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
          });
        }

        // Check plain lyrics candidates too
        if (!fallbackPlainLyrics) {
          const plainCandidates = searchData
            .filter(track => track.plainLyrics)
            .map(track => {
              const candidateDurationMs = track.duration != null
                ? Number(track.duration) * 1000
                : null;

              const score = computeMatchScore(
                track.trackName || '',
                track.artistName || '',
                candidateDurationMs,
                cleanTitle,
                cleanArtist,
                targetDurationSec,
              );

              return { track, score };
            })
            .filter(entry => entry.score >= MIN_CONFIDENCE_PLAIN)
            .sort((a, b) => b.score - a.score);

          if (plainCandidates.length > 0) {
            fallbackPlainLyrics = plainCandidates[0].track.plainLyrics;
            fallbackPlainConfidence = plainCandidates[0].score;
          }
        }
      }

      if (fallbackPlainLyrics && fallbackPlainConfidence >= MIN_CONFIDENCE_PLAIN) {
        return NextResponse.json({ synced: false, type: 'lrc', lyrics: fallbackPlainLyrics, source: 'lrclib' }, {
          headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        console.warn('lrclib search timed out (>15s)');
      } else {
        console.error('lrclib search failed:', err);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. lyrics.ovh — plain lyrics only (last resort)
    // ═══════════════════════════════════════════════════════════════
    try {
      let ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
      let ovhRes = await fetch(ovhUrl, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });

      if (!ovhRes.ok && primaryArtist !== cleanArtist) {
        ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(primaryArtist)}/${encodeURIComponent(cleanTitle)}`;
        ovhRes = await fetch(ovhUrl, { signal: AbortSignal.timeout(10000), next: { revalidate: 86400 } });
      }

      if (ovhRes.ok) {
        const ovhData = await ovhRes.json();
        if (ovhData.lyrics) {
          return NextResponse.json({ synced: false, type: 'lrc', lyrics: ovhData.lyrics, source: 'ovh' }, {
            headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }
          });
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        console.warn('lyrics.ovh search timed out (>10s)');
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
