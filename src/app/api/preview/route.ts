import { NextRequest, NextResponse } from 'next/server';
import { getITunesPreviewUrl } from '@/lib/server/itunesApi';

export const runtime = 'nodejs';

/**
 * GET /api/preview?title=...&artist=...
 *
 * Resolves a 30s preview URL from iTunes.
 */
export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title');
  const artist = request.nextUrl.searchParams.get('artist') || '';

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
  }

  try {
    const itunesPreview = await getITunesPreviewUrl(title.trim(), artist.trim());
    if (itunesPreview) {
      return NextResponse.json({ previewUrl: itunesPreview, source: 'itunes' });
    }

    return NextResponse.json({ previewUrl: null, source: null });
  } catch (error) {
    console.error('Preview resolve failed:', error);
    return NextResponse.json({ previewUrl: null, source: null }, { status: 500 });
  }
}
