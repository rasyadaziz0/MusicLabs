import { NextRequest, NextResponse } from 'next/server';
import { getITunesArtist, getITunesArtistAlbums } from '@/lib/server/itunesApi';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ data: null }, { status: 400 });
  }

  if (id.startsWith('dz-') || id.startsWith('sp-')) {
    return NextResponse.json({ data: null, error: 'Legacy IDs are no longer supported. Please search again.' }, { status: 404 });
  }

  try {
    // Strip "itunes-artist-" prefix if present
    const itunesId = id.replace(/^itunes-artist-/, '');

    const [artist, albums] = await Promise.all([
      getITunesArtist(itunesId),
      getITunesArtistAlbums(itunesId, 5),
    ]);

    return NextResponse.json({
      data: {
        ...artist,
        nb_album: albums.length,
      },
    });
  } catch (error) {
    console.error('iTunes artist info failed:', error);
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
