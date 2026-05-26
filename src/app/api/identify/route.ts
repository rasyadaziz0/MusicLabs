import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getRequestIp } from '@/lib/server/rateLimit';
import { Song } from '@/types/music';

export const runtime = 'nodejs';

import { searchITunesTracks } from '@/lib/server/itunesApi';

// ── Helpers ───────────────────────────────────────────────────────

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

// ── POST handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── Auth check: require logged-in user ──────────────────────────
  const bearerToken = getBearerToken(request);
  if (!bearerToken) {
    return NextResponse.json(
      { error: 'Login required to use song identification.' },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Server configuration error.' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${bearerToken}` },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(bearerToken);

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Login required to use song identification.' },
      { status: 401 }
    );
  }

  // ── Rate limit: per-IP (10/min) ─────────────────────────────────
  const ip = getRequestIp(request);
  const ipLimiter = await checkRateLimit(ip, {
    limit: 10,
    windowMs: 60_000,
    keyPrefix: 'identify:ip',
  });

  if (!ipLimiter.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      {
        status: 429,
        headers: { 'Retry-After': String(ipLimiter.resetInSeconds) },
      }
    );
  }

  // ── Rate limit: per-user (5/min) ────────────────────────────────
  const userLimiter = await checkRateLimit(user.id, {
    limit: 5,
    windowMs: 60_000,
    keyPrefix: 'identify:user',
  });

  if (!userLimiter.allowed) {
    return NextResponse.json(
      { error: 'You\'re identifying songs too fast. Please wait a moment.' },
      {
        status: 429,
        headers: { 'Retry-After': String(userLimiter.resetInSeconds) },
      }
    );
  }

  const token = process.env.AUDD_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'AudD API token not configured.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const audioBase64: string | undefined = body?.audio;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing audio data.' },
        { status: 400 }
      );
    }

    // Limit payload size (~2MB base64 ≈ ~1.5MB raw audio)
    if (audioBase64.length > 2_500_000) {
      return NextResponse.json(
        { error: 'Audio data too large. Record a shorter clip.' },
        { status: 413 }
      );
    }

    // Convert base64 to a real Blob and send as file upload
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('api_token', token);
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('return', 'apple_music');

    const auddRes = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: formData,
    });

    if (!auddRes.ok) {
      console.error('AudD API error:', auddRes.status, await auddRes.text());
      return NextResponse.json(
        { error: 'Song identification service error.' },
        { status: 502 }
      );
    }

    const auddData = await auddRes.json();

    if (auddData.status === 'error') {
      console.error('AudD error response:', auddData.error);
      return NextResponse.json(
        { error: auddData.error?.error_message || 'Identification failed.' },
        { status: 500 }
      );
    }

    // No match found
    if (!auddData.result) {
      return NextResponse.json({ match: null, provider: 'audd' });
    }

    const result = auddData.result;
    const title = result.title || '';
    const artist = result.artist || '';
    const album = result.album || '';

    // Search iTunes for the identified song (broad catalog with preview URLs)
    let match: Song | null = null;

    // Strategy 1: Search "artist title" (most specific)
    if (title && artist) {
      const songs = await searchITunesTracks(`${artist} ${title}`, 5);
      match = songs[0] || null;
    }

    // Strategy 2: Search title only
    if (!match && title) {
      const songs = await searchITunesTracks(title, 5);
      match = songs[0] || null;
    }

    // Strategy 3: Search artist only
    if (!match && artist) {
      const songs = await searchITunesTracks(artist, 3);
      match = songs[0] || null;
    }

    // Strategy 4: Construct minimal Song from AudD raw data
    if (!match && (title || artist)) {
      const coverUrl = result.apple_music?.artwork?.url?.replace('{w}', '600').replace('{h}', '600') || '';

      match = {
        id: `audd-${Date.now()}`,
        name: title || 'Unknown Title',
        type: 'song',
        year: result.release_date?.slice(0, 4) || '',
        releaseDate: result.release_date || null,
        duration: result.apple_music?.durationInMillis
          ? Math.round(result.apple_music.durationInMillis / 1000)
          : 0,
        label: '',
        explicitContent: false,
        playCount: 0,
        language: '',
        hasLyrics: false,
        lyricsId: null,
        url: result.song_link || '',
        copyright: '',
        album: { id: '', name: album, url: '' },
        artists: {
          primary: [{
            id: '', name: artist || 'Unknown Artist',
            role: 'primary', type: 'artist', image: [], url: '',
          }],
          featured: [],
          all: [{
            id: '', name: artist || 'Unknown Artist',
            role: 'primary', type: 'artist', image: [], url: '',
          }],
        },
        image: coverUrl ? [{ quality: '500x500', url: coverUrl }] : [],
        downloadUrl: [],
        preview: result.apple_music?.previews?.[0]?.url || '',
      };
    }

    return NextResponse.json({
      match,
      provider: 'audd',
      raw: {
        title,
        artist,
        album,
        releaseDate: result.release_date || '',
      },
    });
  } catch (err) {
    console.error('Identify route error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

