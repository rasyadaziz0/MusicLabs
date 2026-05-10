import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SPOTIFY_PLAYLIST_API_BASE = 'https://api.spotify.com/v1/playlists';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Sesi lu nggak valid.' }, { status: 401 });
    }

    const spotifyToken = request.cookies.get('spotify_token')?.value;
    if (!spotifyToken) {
      return NextResponse.json({ error: 'Lu belum Connect Spotify!' }, { status: 403 });
    }

    const { url } = await request.json();

    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) return NextResponse.json({ error: 'Link Spotify nggak valid' }, { status: 400 });

    const playlistId = match[1];
    const res = await fetch(`${SPOTIFY_PLAYLIST_API_BASE}/${playlistId}`, {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Gagal narik playlist dari Spotify');
    }

    const data = await res.json();

    const tracks = data.tracks.items
      .filter((item: any) => item.track !== null) // Jaga-jaga ada lagu yang udah dihapus
      .map((item: any) => ({
        name: item.track.name,
        artist: item.track.artists[0].name,
        searchQuery: `${item.track.name} ${item.track.artists[0].name}`,
      }));

    return NextResponse.json({
      playlistName: data.name,
      tracks: tracks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal narik data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
