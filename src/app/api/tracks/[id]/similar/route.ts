import { NextRequest, NextResponse } from 'next/server';
import { getITunesTrack } from '@/lib/server/itunesApi';
import { getYtMusicClient, mapUpNextToAppSong } from '@/lib/server/ytmusic';
import { Song } from '@/types/music';

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

  if (!id) {
    return NextResponse.json({ error: 'Invalid track id' }, { status: 400 });
  }

  try {
    let videoId = id;

    // If it's an iTunes ID, we need to resolve it to a YouTube videoId first
    if (!isYouTubeVideoId(id)) {
      const itunesId = id.replace(/^itunes-/, '');
      const song = await getITunesTrack(itunesId);
      
      if (!song) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }

      const client = await getYtMusicClient();
      const query = `${song.name} ${song.artists.primary[0]?.name || ''}`.trim();
      
      // Search for the song on YT Music
      const searchResults = await client.searchSongs(query);
      if (!searchResults || searchResults.length === 0 || !searchResults[0].videoId) {
         return NextResponse.json({ error: 'Could not find similar tracks on YouTube Music' }, { status: 404 });
      }
      
      videoId = searchResults[0].videoId;
    }

    // Now we have a valid videoId, fetch UpNext / Similar Tracks
    const client = await getYtMusicClient();
    const upNexts = await client.getUpNexts(videoId);

    if (!upNexts || upNexts.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Filter out non-song items and the original song itself, map to our Song interface
    const mappedSongs: Song[] = upNexts
      .filter((item: any) => item.type === 'SONG' && item.videoId && item.videoId !== videoId)
      .map((item: any) => mapUpNextToAppSong(item))
      .filter((song: any): song is Song => song !== null);

    return NextResponse.json({ data: mappedSongs });
  } catch (error) {
    console.error('Similar tracks fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch similar tracks' }, { status: 500 });
  }
}
