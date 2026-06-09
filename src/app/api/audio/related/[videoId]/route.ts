import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';
import { createClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Song } from '@/types/music';

export const runtime = 'nodejs';

let yt: Innertube | null = null;
let lastInit = 0;

async function getYt() {
  const now = Date.now();
  if (!yt || now - lastInit > 1000 * 60 * 10) {
    yt = await Innertube.create();
    lastInit = Date.now();
  }
  return yt;
}

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

const GEMINI_KEY = process.env.GOOGLE_GEMINI_DISCOVER_KEY ?? '';

function mapYoutubeiToSong(item: any): Song | null {
  const videoId = item.id || item.video_id || item.videoId;
  if (!videoId) return null;

  const title = item.title?.text || item.title || 'Unknown Title';
  const authorName = item.author?.name || (typeof item.author === 'string' ? item.author : 'Unknown Artist');
  const thumbnail = item.thumbnail?.[0]?.url || item.thumbnails?.[0]?.url || '';

  // parse duration string like "3:24" -> seconds
  let durationInSeconds = 0;
  const durStr = item.duration?.text || item.duration;
  if (typeof durStr === 'string') {
    const parts = durStr.split(':').map(Number);
    if (parts.length === 2) {
      durationInSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      durationInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  return {
    id: videoId,
    name: title,
    type: 'song',
    year: '',
    releaseDate: null,
    duration: durationInSeconds,
    label: 'YouTube Music',
    explicitContent: false,
    playCount: 0,
    language: '',
    hasLyrics: false,
    lyricsId: null,
    url: `https://music.youtube.com/watch?v=${videoId}`,
    copyright: '',
    album: { id: `album-${videoId}`, name: 'Single', url: '' },
    artists: {
      primary: [{ id: `artist-${videoId}`, name: authorName, role: 'primary', type: 'artist', image: [], url: '' }],
      featured: [],
      all: [{ id: `artist-${videoId}`, name: authorName, role: 'primary', type: 'artist', image: [], url: '' }],
    },
    image: thumbnail ? [{ quality: '500x500', url: thumbnail }] : [],
    downloadUrl: [{ quality: '320kbps', url: `/api/audio/${videoId}` }],
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { videoId } = await params;
  const title = request.nextUrl.searchParams.get('title') || '';
  const artist = request.nextUrl.searchParams.get('artist') || '';
  const userId = request.nextUrl.searchParams.get('userId') || 'anonymous';

  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });

  const cacheKey = `related:v2:${videoId}`;
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({ songs: cached, source: 'cache' });
    }
  }

  try {
    // 1. Primary: YouTube Music Up Next
    const youtube = await getYt();
    const upNext = await youtube.music.getUpNext(videoId);
    const contents = upNext?.contents;

    if (Array.isArray(contents) && contents.length > 0) {
      const songs: Song[] = [];
      for (const item of contents) {
        if (item.type === 'PlaylistPanelVideo' || item.type === 'MusicResponsiveListItem') {
          const mapped = mapYoutubeiToSong(item);
          if (mapped) songs.push(mapped);
        }
      }

      if (songs.length > 0) {
        if (redis) await redis.setex(cacheKey, 86400, songs);
        return NextResponse.json({ songs, source: 'youtube' });
      }
    }

    // 2. Fallback: Gemini
    if (!title || !artist) {
      return NextResponse.json({ error: 'YT Radio empty and no title/artist for Gemini fallback' }, { status: 404 });
    }

    // Gemini Rate Limit Check (Cooldown)
    const userGeminiKey = `gemini_cooldown:${userId}`;
    if (redis) {
      const inCooldown = await redis.get(userGeminiKey);
      if (inCooldown) {
        return NextResponse.json({ error: 'Gemini rate limited for this user' }, { status: 429 });
      }
      // 5 mins cooldown for fallback
      await redis.setex(userGeminiKey, 300, '1');
    }

    if (!GEMINI_KEY) throw new Error("No Gemini key");
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `Give me 10 similar songs to "${title}" by "${artist}". Format as JSON array of objects with "title" and "artist".`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const suggestions = JSON.parse(text);

    // Instead of resolving all via YT server side (which is slow), we return them to the client
    // Or we just return them and let the client handle it. But to keep the architecture clean,
    // let's just do a basic YT search for each. Since it's server side, we can just use `youtube.music.search`.
    const fallbackSongs: Song[] = [];
    for (const item of suggestions) {
      if (!item.title || !item.artist) continue;
      try {
        const searchResults = await youtube.music.search(`${item.title} ${item.artist}`, { type: 'song' });
        const first = searchResults?.songs?.contents?.[0];
        if (first) {
          const mapped = mapYoutubeiToSong(first);
          if (mapped) fallbackSongs.push(mapped);
        }
      } catch (e) {
         // ignore
      }
    }

    if (fallbackSongs.length > 0) {
      if (redis) await redis.setex(cacheKey, 86400, fallbackSongs);
      return NextResponse.json({ songs: fallbackSongs, source: 'gemini' });
    }

    return NextResponse.json({ error: 'No related songs found via fallback' }, { status: 404 });

  } catch (error: any) {
    console.error('Related API error:', error);
    return NextResponse.json({ error: 'Failed to fetch related tracks' }, { status: 500 });
  }
}
