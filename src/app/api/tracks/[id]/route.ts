import { NextRequest, NextResponse } from 'next/server';
import { getITunesTrack } from '@/lib/server/itunesApi';
import { getYtMusicClient, mapYtSongToAppSong } from '@/lib/server/ytmusic';

export const runtime = 'nodejs';

/** YouTube video IDs are 11-char alphanumeric with - and _ */
function isYouTubeVideoId(id: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (id.startsWith('dz-') || id.startsWith('sp-')) {
    return NextResponse.json({ error: 'Legacy IDs are no longer supported. Please search and add this track again.' }, { status: 404 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Invalid track id' }, { status: 400 });
  }

  // ── YouTube videoId ──────────────────────────────────────────────
  if (isYouTubeVideoId(id)) {
    try {
      const client = await getYtMusicClient();
      const songData = await client.getSong(id);
      if (!songData) {
        return NextResponse.json({ error: 'YouTube track not found' }, { status: 404 });
      }
      const mapped = mapYtSongToAppSong(songData as any);
      if (!mapped) {
        return NextResponse.json({ error: 'Could not map YouTube track' }, { status: 404 });
      }
      return NextResponse.json({ data: mapped });
    } catch (error) {
      console.error('YouTube Music track fetch failed:', error);
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }
  }

  // ── iTunes numeric ID ────────────────────────────────────────────
  // Strip "itunes-" prefix if present
  const itunesId = id.replace(/^itunes-/, '');

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
