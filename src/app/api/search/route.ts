import { NextRequest, NextResponse } from 'next/server';
import { mapYoutubeApiToAppSong } from '@/lib/server/ytmusic';
import { Song } from '@/types/music';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') || request.nextUrl.searchParams.get('query');

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query lagu kosong.' }, { status: 400 });
  }

  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY belum di set' }, { status: 500 });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query.trim())}&type=video&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
       console.error("Youtube API error:", data.error);
       return NextResponse.json({ error: 'YouTube API error' }, { status: 500 });
    }

    const normalized = (data.items || []).map(mapYoutubeApiToAppSong).filter((item: any): item is Song => Boolean(item));
    return NextResponse.json(normalized);
  } catch (error) {
    console.error('YouTube search failed:', error);
    return NextResponse.json({ error: 'Gagal nyari lagu' }, { status: 500 });
  }
}
