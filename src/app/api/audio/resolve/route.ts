import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

export const runtime = 'nodejs';

type YoutubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
  };
};

let yt: Innertube | null = null;

async function getYt() {
  if (!yt) {
    yt = await Innertube.create();
  }
  return yt;
}

function getYoutubeApiKeys() {
  return [
    process.env.YOUTUBE_API_KEY1,
    process.env.YOUTUBE_API_KEY2,
    process.env.YOUTUBE_API_KEY3,
    process.env.YOUTUBE_API_KEY,
  ].filter((value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index);
}

function normalizeText(text: string) {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()} `;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function scoreFallbackCandidate(item: YoutubeSearchItem, title: string, artist: string) {
  const rawTitle = item.snippet?.title ?? '';
  const rawDescription = item.snippet?.description ?? '';
  const rawChannel = item.snippet?.channelTitle ?? '';
  const text = normalizeText(`${rawTitle} ${rawDescription} ${rawChannel}`);

  const hardBlockTerms = ['vevo', 'official', 'topic', '- topic', 'provided to youtube by'];
  if (hardBlockTerms.some((term) => text.includes(` ${normalizeText(term).trim()} `))) {
    return -999;
  }

  let score = 0;
  const preferredTerms = ['audio', 'lyric', 'lyrics'];
  preferredTerms.forEach((term) => {
    if (text.includes(` ${term} `)) score += 8;
  });

  const noisyTerms = ['live', 'concert', 'karaoke', 'cover', 'reaction', 'teaser', 'trailer'];
  noisyTerms.forEach((term) => {
    if (text.includes(` ${term} `)) score -= 7;
  });

  const titleNormalized = normalizeText(title).trim();
  const artistNormalized = normalizeText(artist).trim();
  if (titleNormalized && text.includes(` ${titleNormalized} `)) score += 25;
  if (artistNormalized && text.includes(` ${artistNormalized} `)) score += 15;

  return score;
}

async function resolveFallbackVideoId(title: string, artist: string): Promise<string | null> {
  const apiKeys = getYoutubeApiKeys();
  if (apiKeys.length === 0) return null;

  const query = `${title} ${artist} audio lyric`.trim();

  for (const key of apiKeys) {
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?part=id,snippet&maxResults=12&type=video&videoCategoryId=10` +
      `&q=${encodeURIComponent(query)}&key=${key}`;

    const response = await fetch(searchUrl, { cache: 'no-store' });
    if (!response.ok) continue;

    const payload = (await response.json()) as { items?: YoutubeSearchItem[] };
    const items = Array.isArray(payload.items) ? payload.items : [];
    const ranked = items
      .map((item) => ({ item, score: scoreFallbackCandidate(item, title, artist) }))
      .filter((entry) => entry.score > -999)
      .sort((a, b) => b.score - a.score);

    const best = ranked[0]?.item?.id?.videoId ?? items[0]?.id?.videoId;
    if (best) return best;
  }

  return null;
}

/**
 * GET /api/audio/resolve?title=...&artist=...
 *
 * Mencari lagu di YouTube menggunakan youtubei.js (lebih stabil dari Piped API).
 */
export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title');
  const artist = request.nextUrl.searchParams.get('artist');
  const fallback = request.nextUrl.searchParams.get('fallback') === '1';

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
  }

  if (fallback) {
    try {
      const fallbackVideoId = await resolveFallbackVideoId(title.trim(), artist?.trim() ?? '');
      if (!fallbackVideoId) {
        return NextResponse.json({ error: 'No fallback video found' }, { status: 404 });
      }

      return NextResponse.json({ videoId: fallbackVideoId, source: 'fallback' });
    } catch (error: unknown) {
      console.error('Fallback resolve failed:', getErrorMessage(error));
      return NextResponse.json({ error: 'Failed to resolve fallback video' }, { status: 500 });
    }
  }

  const query = artist?.trim() 
    ? `${title.trim()} ${artist.trim()}`
    : title.trim();

  try {
    const youtube = await getYt();
    
    // Step 1: Search for the track
    // Gunakan youtube.music.search dengan filter 'song' agar hanya mendapatkan lagu official
    // dan menghindari hasil berupa playlist atau music video panjang.
    const searchResults = await youtube.music.search(query, { type: 'song' });
    
    if (!searchResults.songs || !searchResults.songs.contents || searchResults.songs.contents.length === 0) {
      return NextResponse.json({ error: 'No song results found on YouTube Music' }, { status: 404 });
    }

    // Ambil lagu pertama (paling relevan dari YouTube Music)
    const firstSong = searchResults.songs.contents[0];
    
    // Pastikan ini adalah object yang punya id
    if (!('id' in firstSong) || !firstSong.id) {
      return NextResponse.json({ error: 'Invalid search result format' }, { status: 404 });
    }

    const videoId = firstSong.id as string;

    // Kembalikan videoId dan metadata dasar langsung (tanpa getInfo yang lambat)
    return NextResponse.json({
      videoId,
      title: firstSong.title,
      artist: typeof firstSong.artists === 'string' ? firstSong.artists : firstSong.author,
      duration: firstSong.duration?.text,
    });

  } catch (error: unknown) {
    console.error('Audio resolve failed with youtubei.js:', getErrorMessage(error));

    return NextResponse.json(
      { error: 'Failed to resolve audio: ' + getErrorMessage(error) },
      { status: 500 }
    );
  }
}
