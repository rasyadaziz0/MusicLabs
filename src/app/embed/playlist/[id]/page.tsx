import { Metadata } from 'next';
import { cache } from 'react';
import { PlaylistRepository } from '@/lib/supabase/repositories/PlaylistRepository';
import EmbedPlaylistPlayer from './EmbedPlaylistPlayer';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { createClient } from '@/lib/supabase/server';

const getPlaylistData = cache(async (playlistId: string) => {
  const supabase = await createClient();
  const repo = new PlaylistRepository(supabase);
  try {
    const playlist = await repo.getPlaylistById(playlistId);
    
    // For embeds, we only allow public playlists
    if (!playlist || !playlist.is_public) {
      return null;
    }

    const tracks = await repo.getPlaylistTracks(playlistId);
    return { playlist, tracks };
  } catch (error) {
    return null;
  }
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getPlaylistData(id);

  if (!data) {
    return { title: 'Playlist Not Found' };
  }

  return {
    title: `${data.playlist.name} | AcadMusic Embed`,
    description: data.playlist.description || 'Listen to this playlist on AcadMusic.',
    robots: 'noindex, nofollow', // Prevent search engines from indexing the raw embed pages
  };
}

export default async function EmbedPlaylistPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getPlaylistData(id);

  if (!data) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        height: '100vh', width: '100%', 
        background: '#080616', color: 'rgba(255,255,255,0.5)',
        fontFamily: 'system-ui, sans-serif', fontSize: '14px'
      }}>
        Playlist not found or is private
      </div>
    );
  }

  const { playlist, tracks } = data;
  
  const coverUrl = playlist.cover_url || getBestImageUrl(tracks[0]?.image ?? []) || '';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  // Map tracks to a simpler format for the client
  const mappedTracks = tracks.map(t => ({
    id: t.id,
    name: t.name,
    artistName: t.artists?.primary?.[0]?.name || 'Unknown Artist',
    coverUrl: getBestImageUrl(t.image) || '',
    duration: t.duration,
  }));

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
      <EmbedPlaylistPlayer 
        playlistId={playlist.id}
        playlistName={playlist.name}
        coverUrl={coverUrl}
        tracks={mappedTracks}
        isLoggedIn={isLoggedIn}
      />
    </main>
  );
}
