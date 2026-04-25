import { NextRequest, NextResponse } from 'next/server';
import { searchDeezerTracks, searchDeezerArtists } from '@/lib/server/deezerApi';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || request.nextUrl.searchParams.get('query');

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query kosong.' }, { status: 400 });
  }

  try {
    const [songs, artists] = await Promise.all([
      searchDeezerTracks(query.trim(), 10),
      searchDeezerArtists(query.trim(), 5),
    ]);

    return NextResponse.json({
      data: {
        songs,
        artists,
      },
    });
  } catch (error) {
    console.error('Deezer combined search failed:', error);
    return NextResponse.json({ error: 'Gagal nyari lagu' }, { status: 500 });
  }
}
