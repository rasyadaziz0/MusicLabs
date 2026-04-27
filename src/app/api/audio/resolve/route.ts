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
    // Gunakan youtube.music.search dengan filter 'song' agar hanya mendapatkan lagu official
    // dan menghindari hasil berupa playlist atau music video panjang.
    const searchResults = await youtube.music.search(query, { type: 'song' });
    
    if (!searchResults.songs || !searchResults.songs.contents || searchResults.songs.contents.length === 0) {
      return NextResponse.json({ error: 'No song results found on YouTube Music' }, { status: 404 });
    }

    // Ambil lagu pertama (paling relevan dari YouTube Music)
    const firstSong = searchResults.songs.contents[0];
    
    // Pastikan ini adalah object yang punya id
    if (!('id' in firstSong) || !firstSong.id) {
      return NextResponse.json({ error: 'Invalid search result format' }, { status: 404 });
    }

    const videoId = firstSong.id as string;

    // Kembalikan videoId dan metadata dasar langsung (tanpa getInfo yang lambat)
    return NextResponse.json({
      videoId,
      title: firstSong.title,
      artist: typeof firstSong.artists === 'string' ? firstSong.artists : firstSong.author,
      duration: firstSong.duration?.text,
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
