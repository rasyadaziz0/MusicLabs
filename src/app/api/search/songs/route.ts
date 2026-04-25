import { NextRequest, NextResponse } from 'next/server';
import { searchDeezerTracks } from '@/lib/server/deezerApi';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || request.nextUrl.searchParams.get('q');
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  if (!query?.trim()) {
    return NextResponse.json({ data: { results: [] } });
  }

  try {
    const songs = await searchDeezerTracks(query.trim(), limit);
    return NextResponse.json({ data: { results: songs } });
  } catch (error) {
    console.error('Deezer search/songs failed:', error);
    return NextResponse.json({ data: { results: [] } }, { status: 500 });
  }
}
