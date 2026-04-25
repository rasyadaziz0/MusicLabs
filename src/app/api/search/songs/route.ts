import { NextRequest, NextResponse } from 'next/server';
import { mapYoutubeApiToAppSong } from '@/lib/server/ytmusic';
import { Song } from '@/types/music';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || request.nextUrl.searchParams.get('q');

  if (!query?.trim()) {
    return NextResponse.json({ data: { results: [] } });
  }

  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY belum di set');
    return NextResponse.json({ data: { results: [] } }, { status: 500 });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query.trim())}&type=video&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
       console.error("Youtube API error:", data.error);
       return NextResponse.json({ data: { results: [] } }, { status: 500 });
    }

    const normalized = (data.items || []).map(mapYoutubeApiToAppSong).filter((item: any): item is Song => Boolean(item));
    return NextResponse.json({ data: { results: normalized } });
  } catch (error) {
    console.error('YouTube search/songs failed:', error);
    return NextResponse.json({ data: { results: [] } }, { status: 500 });
  }
}
