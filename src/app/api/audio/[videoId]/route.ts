import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

export const runtime = 'nodejs';

// Singleton Innertube instance — avoids creating a new client per request
let ytInstance: Innertube | null = null;

async function getYt() {
  if (!ytInstance) {
    ytInstance = await Innertube.create();
  }
  return ytInstance;
}

/**
 * GET /api/audio/{videoId}
 * 
 * Proxy fallback untuk mengambil audio stream URL langsung dari YouTube via youtubei.js.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!videoId || !/^[A-Za-z0-9_-]{10,12}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId format' }, { status: 400 });
  }

  try {
    const youtube = await getYt();
    const info = await youtube.getInfo(videoId);

    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    const audioUrl = format ? await format.decipher(youtube.session.player) : null;

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'No playable audio stream found for this music' },
        { status: 404 }
      );
    }

    // If ?redirect=1, redirect directly (legacy behavior)
    if (request.nextUrl.searchParams.get('redirect') === '1') {
      return NextResponse.redirect(audioUrl);
    }

    // Default: return URL as JSON so client can set audio.src directly
    return NextResponse.json({ url: audioUrl });
  } catch (error: unknown) {
    console.error('Audio proxy error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to resolve audio stream' },
      { status: 500 }
    );
  }
}
