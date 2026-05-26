import { NextResponse } from 'next/server';
import { getYtMusicClient, mapYtSongToAppSong } from '@/lib/server/ytmusic';

export const runtime = 'nodejs';
// Disable Next.js data cache for this route to ensure fresh home feed
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const client = await getYtMusicClient();
    
    // Fetch home sections
    const sections = await client.getHomeSections();
    
    // Pick the first section with songs as "Trending Songs" or fallback to an empty array
    let trendingSongs: any[] = [];
    let albums: any[] = [];
    let playlists: any[] = [];

    // Parse sections
    for (const section of sections) {
      if (section.contents) {
        for (const item of section.contents) {
          if ((item.type as string) === 'SONG' || (item.type as string) === 'VIDEO') {
            if (trendingSongs.length < 15) {
              const mapped = mapYtSongToAppSong(item as any);
              if (mapped) trendingSongs.push(mapped);
            }
          } else if (item.type === 'ALBUM') {
            if (albums.length < 10) {
              albums.push({
                id: item.albumId,
                name: item.name,
                image: item.thumbnails?.map((t: any) => ({
                  quality: `${t.width}x${t.height}`,
                  url: t.url.replace(/[)\]}>\s]+$/g, '')
                })) || [],
                primaryArtists: [{ name: item.artist?.name || 'Unknown' }],
              });
            }
          } else if (item.type === 'PLAYLIST') {
            if (playlists.length < 10) {
              playlists.push({
                id: item.playlistId,
                name: item.name,
                image: item.thumbnails?.map((t: any) => ({
                  quality: `${t.width}x${t.height}`,
                  url: t.url.replace(/[)\]}>\s]+$/g, '')
                })) || [],
                owner: item.artist?.name || 'YouTube Music',
              });
            }
          }
        }
      }
    }

    // If we didn't find enough songs in home sections, fetch trending songs directly
    if (trendingSongs.length < 15) {
      const searchResults = await client.searchSongs('Top Hits Indonesia');
      if (searchResults && searchResults.length > 0) {
        const mappedSongs = searchResults
          .slice(0, 15)
          .map((v: any) => mapYtSongToAppSong(v))
          .filter(Boolean);
        trendingSongs = [...trendingSongs, ...mappedSongs];
      }
    }

    return NextResponse.json({
      data: {
        trending: {
          songs: trendingSongs,
          albums: [],
        },
        albums,
        charts: [],
        playlists,
      },
    });
  } catch (error) {
    console.error('YouTube Music home feed failed:', error);
    return NextResponse.json(
      { data: { trending: { songs: [], albums: [] }, albums: [], charts: [], playlists: [] } },
      { status: 500 }
    );
  }
}
