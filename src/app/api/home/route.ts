import { NextResponse } from 'next/server';
import { getDeezerChart } from '@/lib/server/deezerApi';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const chart = await getDeezerChart();

    // Return shape yang compatible sama home page yang udah ada
    return NextResponse.json({
      data: {
        trending: {
          songs: chart.tracks,
          albums: [],
        },
        albums: chart.albums.map((album) => ({
          id: album.id,
          name: album.title,
          image: [{ quality: '500x500', url: album.cover }],
          primaryArtists: [{ name: album.artist }],
        })),
        charts: [],
        playlists: [],
      },
    });
  } catch (error) {
    console.error('Deezer chart/home feed failed:', error);
    return NextResponse.json(
      { data: { trending: { songs: [], albums: [] }, albums: [], charts: [], playlists: [] } },
      { status: 500 }
    );
  }
}
