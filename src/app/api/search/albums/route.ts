import { NextResponse } from 'next/server';
import { searchITunesAlbums } from '@/lib/server/itunesApi';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || searchParams.get('q');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  const country = searchParams.get('country') || 'ID';

  if (!query?.trim()) {
    return NextResponse.json({ data: { results: [] } });
  }

  try {
    const albums = await searchITunesAlbums(query.trim(), limit, country);
    return NextResponse.json({ results: albums });
  } catch (error) {
    console.error('iTunes search/albums failed:', error);
    return NextResponse.json({ error: 'Failed to search albums' }, { status: 500 });
  }
}
