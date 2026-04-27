import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

export const runtime = 'nodejs';

let yt: Innertube | null = null;

async function getYt() {
  if (!yt) {
    yt = await Innertube.create();
  }
  return yt;
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

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  try {
    const youtube = await getYt();
    const info = await youtube.getInfo(videoId);

    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    const audioUrl = format ? await format.decipher(youtube.session.player) : null;

    if (!audioUrl) {
      return new NextResponse('No playable audio stream found for this music', {
        status: 404,
      });
    }

    return NextResponse.redirect(audioUrl);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Audio proxy error', message);
    return new NextResponse('Failed to resolve audio: ' + message, {
      status: 500,
    });
  }
}
