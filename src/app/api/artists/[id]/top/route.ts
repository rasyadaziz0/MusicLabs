import { NextRequest, NextResponse } from 'next/server';
import { getDeezerArtistTopTracks } from '@/lib/server/deezerApi';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  if (!id) {
    return NextResponse.json({ data: { songs: [] } });
  }

  try {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ data: { songs: [] } });
    }

    const songs = await getDeezerArtistTopTracks(numericId, limit);
    return NextResponse.json({ data: { songs } });
  } catch (error) {
    console.error('Deezer artist top tracks failed:', error);
    return NextResponse.json({ data: { songs: [] } }, { status: 500 });
  }
}
