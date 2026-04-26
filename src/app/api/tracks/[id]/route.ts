import { NextRequest, NextResponse } from 'next/server';
import { getDeezerTrack } from '@/lib/server/deezerApi';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = id.replace(/^dz-/, '');

  if (!numericId || Number.isNaN(Number(numericId))) {
    return NextResponse.json({ error: 'Invalid track id' }, { status: 400 });
  }

  try {
    const song = await getDeezerTrack(Number(numericId));
    return NextResponse.json({ data: song });
  } catch (error) {
    console.error('Deezer track fetch failed:', error);
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }
}
