import { NextRequest, NextResponse } from 'next/server';
import { getYtMusicClient, mapYtArtistToSearchArtist } from '@/lib/server/ytmusic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || request.nextUrl.searchParams.get('q');

  if (!query?.trim()) {
    return NextResponse.json({ data: { results: [] } });
  }

  try {
    const ytmusic = await getYtMusicClient();
    const artists = await ytmusic.searchArtists(query.trim());
    const normalized = artists
      .map(mapYtArtistToSearchArtist)
      .filter((item): item is NonNullable<ReturnType<typeof mapYtArtistToSearchArtist>> => Boolean(item));
    return NextResponse.json({ data: { results: normalized } });
  } catch (error) {
    console.error('YTM search/artists failed:', error);
    return NextResponse.json({ data: { results: [] } }, { status: 500 });
  }
}
