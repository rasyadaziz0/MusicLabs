import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * GET /api/search/youtube?q=...
 * 
 * Proxy ke YouTube Data API v3 untuk mencari videoId.
 * Menggunakan Edge Runtime untuk performa maksimal.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  
  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!API_KEY) {
    console.error('YOUTUBE_API_KEY is missing');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=id&maxResults=1&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('YouTube API Error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const videoId = data.items?.[0]?.id?.videoId;

    if (!videoId) {
      return NextResponse.json({ error: 'No video found' }, { status: 404 });
    }

    return NextResponse.json({ videoId });
  } catch (error: any) {
    console.error('YouTube search failed:', error.message);
    return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 });
  }
}
