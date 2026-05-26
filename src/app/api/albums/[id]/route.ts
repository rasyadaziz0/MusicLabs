import { NextRequest, NextResponse } from 'next/server';
import { getITunesAlbum } from '@/lib/server/itunesApi';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing album id' }, { status: 400 });
  }

  // Strip prefix if any
  const itunesId = id.replace(/^itunes-album-/, '');

  try {
    const album = await getITunesAlbum(itunesId);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }
    return NextResponse.json({ data: album });
  } catch (error) {
    console.error('Album fetch failed:', error);
    return NextResponse.json({ error: 'Album fetch failed' }, { status: 500 });
  }
}
