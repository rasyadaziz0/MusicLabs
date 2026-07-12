import { NextRequest, NextResponse } from 'next/server';
import { Innertube, UniversalCache, Log } from 'youtubei.js';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Disable internal logging spam from youtubei.js
Log.setLevel(Log.Level.NONE);

let ytInstance: Innertube | null = null;
let lastInit = 0;

async function getYt(forceRefresh = false) {
  const now = Date.now();
  if (!ytInstance || now - lastInit > 1000 * 60 * 10 || forceRefresh) {
    ytInstance = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      retrieve_player: true,
    });
    lastInit = Date.now();
  }
  return ytInstance;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { videoId } = await params;

  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: 'Invalid videoId format' }, { status: 400 });
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const youtube = await getYt(attempt > 0);
      const info = await youtube.getInfo(videoId);

      // Use streaming_data property directly
      const streamingData = info.streaming_data;

      let audioUrl: string | null = null;

      // Cari format audio terbaik dari streamingData
      const audioFormats = streamingData?.adaptive_formats?.filter((f: any) => {
        const mime = f.mime_type || '';
        return f.has_audio && !f.has_video &&
          (mime.includes('audio/mp4') || mime.includes('audio/webm'));
      }).sort((a: any, b: any) => {
        const aMp4 = (a.mime_type || '').includes('audio/mp4');
        const bMp4 = (b.mime_type || '').includes('audio/mp4');
        if (aMp4 && !bMp4) return -1;
        if (!aMp4 && bMp4) return 1;
        return (b.average_bitrate || 0) - (a.average_bitrate || 0);
      }) ?? [];

      for (const format of audioFormats) {
        // getStreamingData() sudah otomatis decipher URL-nya
        const url = format.url;
        if (url) {
          audioUrl = url;
          break;
        }
      }

      // Fallback: coba manual decipher kalau url masih null
      if (!audioUrl) {
        for (const format of audioFormats) {
          try {
            const url = await format.decipher(youtube.session.player);
            if (url) { audioUrl = url; break; }
          } catch {
            // Suppress decipher warning noise
          }
        }
      }

      if (!audioUrl) {
        if (attempt === 0) {
          ytInstance = null;
          continue;
        }
        return NextResponse.json(
          { error: 'No playable audio stream found' },
          { status: 404 }
        );
      }

      if (request.nextUrl.searchParams.get('redirect') === '1') {
        return NextResponse.redirect(audioUrl);
      }

      return NextResponse.json({ url: audioUrl });

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);

      if (attempt === 0) {
        ytInstance = null;
        continue;
      }

      console.error('Audio proxy final error:', msg);
      return NextResponse.json({ error: 'Failed to resolve audio stream', detail: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
}