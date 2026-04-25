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
 * GET /api/audio/resolve?title=...&artist=...
 * 
 * Mencari lagu di YouTube menggunakan youtubei.js (lebih stabil dari Piped API).
 */
export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title');
  const artist = request.nextUrl.searchParams.get('artist');

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
  }

  const query = artist?.trim() 
    ? `${title.trim()} ${artist.trim()}`
    : title.trim();

  try {
    const youtube = await getYt();
    
    // Step 1: Search for the track
    // Kita pakai search() dengan filter 'song' (music) jika memungkinkan, 
    // tapi search biasa juga oke.
    const searchResults = await youtube.search(query, { type: 'video' });
    
    if (!searchResults.videos || searchResults.videos.length === 0) {
      return NextResponse.json({ error: 'No results found on YouTube' }, { status: 404 });
    }

    // Ambil video pertama (biasanya paling relevan)
    // Filter out shorts or live streams if possible, tapi biasanya hasil pertama sudah pas.
    const firstVideo = searchResults.videos[0];
    // Pastikan ini adalah object Video (punya video_id)
    if (!('id' in firstVideo)) {
      return NextResponse.json({ error: 'Invalid search result format' }, { status: 404 });
    }

    const videoId = firstVideo.id;

    // Step 2: Get stream info
    const info = await youtube.getInfo(videoId);
    
    // Pilih format audio saja dengan bitrate terbaik
    // format.url adalah direct link ke audio stream
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });

    if (!format || !format.decipher(youtube.session.player)) {
        // Jika format.url tidak ada, kita coba ambil langsung
    }
    
    const audioUrl = format.decipher(youtube.session.player);

    if (!audioUrl) {
      return NextResponse.json({ error: 'Could not generate playable audio URL' }, { status: 404 });
    }

    return NextResponse.json({
      audioUrl,
      videoId,
      title: info.basic_info.title,
      artist: info.basic_info.author,
      duration: info.basic_info.duration,
      quality: format.audio_track?.audio_is_default ? 'high' : 'standard',
    });

  } catch (error: any) {
    console.error('Audio resolve failed with youtubei.js:', error.message);
    
    // Fallback logic jika youtubei.js gagal (misal rate limited)
    // Di sini kita bisa taruh Piped fallback jika mau, tapi youtubei.js biasanya paling kuat.
    return NextResponse.json(
      { error: 'Failed to resolve audio: ' + error.message },
      { status: 500 }
    );
  }
}
