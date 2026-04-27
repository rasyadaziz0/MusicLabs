import { NextResponse } from 'next/server';

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const authOptions = {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  };

  // URL ASLI SPOTIFY (Pastikan tulisannya persis begini)
  const res = await fetch('https://accounts.spotify.com/api/token', authOptions);

  if (!res.ok) {
    console.error('Gagal dapet token', await res.text());
    throw new Error('Gagal Auth Spotify');
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // Ngambil ID Playlist (Bisa nerima format URL panjang dari share Spotify)
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) return NextResponse.json({ error: 'Link Spotify nggak valid' }, { status: 400 });

    const playlistId = match[1];
    const token = await getSpotifyToken();

    // URL ASLI SPOTIFY BUAT NARIK PLAYLIST
    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
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
