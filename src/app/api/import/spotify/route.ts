import { NextRequest, NextResponse } from 'next/server';
const SPOTIFY_PLAYLIST_API_BASE = 'https://api.spotify.com/v1/playlists';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Ngambil ID Playlist (Bisa nerima format URL panjang dari share Spotify)
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) return NextResponse.json({ error: 'Link Spotify nggak valid' }, { status: 400 });

    const playlistId = match[1];
    const token = request.cookies.get('spotify_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Spotify belum diconnect!' }, { status: 401 });
    }

    const res = await fetch(`${SPOTIFY_PLAYLIST_API_BASE}/${playlistId}`, {
      headers: { Authorization: 'Bearer ' + token },
    });

    // Kalo Spotify nolak (misal karena playlist private)
    if (res.status === 403) {
      return NextResponse.json(
        { error: 'Playlist di-Private! Tolong ubah jadi Public dulu di Spotify lu.' },
        { status: 403 }
      );
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
