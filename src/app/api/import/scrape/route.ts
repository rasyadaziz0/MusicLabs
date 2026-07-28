import { NextResponse } from 'next/server';
import { scrapePlaylist } from '@/lib/scrapers';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const playlist = await scrapePlaylist(url);

    return NextResponse.json({
      success: true,
      data: playlist
    });
  } catch (error: any) {
    console.error('Scraping Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil data dari URL.' },
      { status: 500 }
    );
  }
}
