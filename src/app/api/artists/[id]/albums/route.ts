import { NextRequest, NextResponse } from 'next/server';
import { getDeezerArtistAlbums } from '@/lib/server/deezerApi';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  if (!id) {
    return NextResponse.json({ data: [] });
  }

  try {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ data: [] });
    }

    const albums = await getDeezerArtistAlbums(numericId, limit);
    return NextResponse.json({ data: albums });
  } catch (error) {
    console.error('Artist albums failed:', error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
