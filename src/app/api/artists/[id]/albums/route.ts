import { NextRequest, NextResponse } from 'next/server';
import { getITunesArtistAlbums } from '@/lib/server/itunesApi';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (!id || id.startsWith('dz-') || id.startsWith('sp-')) {
    return NextResponse.json({ data: [] });
  }

  try {
    // Strip "itunes-artist-" prefix if present
    const itunesId = id.replace(/^itunes-artist-/, '');

    const albums = await getITunesArtistAlbums(itunesId, limit);
    return NextResponse.json({ data: albums });
  } catch (error) {
    console.error('iTunes artist albums failed:', error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
