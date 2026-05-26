import { NextRequest, NextResponse } from 'next/server';
import { getITunesTrack } from '@/lib/server/itunesApi';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (id.startsWith('dz-') || id.startsWith('sp-')) {
    return NextResponse.json({ error: 'Legacy IDs are no longer supported. Please search and add this track again.' }, { status: 404 });
  }

  // Strip "itunes-" prefix if present
  const itunesId = id.replace(/^itunes-/, '');

  if (!itunesId) {
    return NextResponse.json({ error: 'Invalid track id' }, { status: 400 });
  }

  try {
    const song = await getITunesTrack(itunesId);
    if (!song) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }
    return NextResponse.json({ data: song });
  } catch (error) {
    console.error('iTunes track fetch failed:', error);
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }
}
