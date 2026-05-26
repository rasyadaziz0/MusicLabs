import { NextRequest, NextResponse } from 'next/server';
import { getITunesArtistTopTracks } from '@/lib/server/itunesApi';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ data: { songs: [] } });
  }

  if (id.startsWith('dz-') || id.startsWith('sp-')) {
    return NextResponse.json({ data: { songs: [] } });
  }

  try {
    // Strip "itunes-artist-" prefix if present
    const itunesId = id.replace(/^itunes-artist-/, '');

    const songs = await getITunesArtistTopTracks(itunesId, 20);
    return NextResponse.json({ data: { songs } });
  } catch (error) {
    console.error('iTunes artist top tracks failed:', error);
    return NextResponse.json({ data: { songs: [] } }, { status: 500 });
  }
}
