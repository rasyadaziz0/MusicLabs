import { Metadata } from 'next';
import { cache } from 'react';
import { getITunesAlbum } from '@/lib/server/itunesApi';
import EmbedPlaylistPlayer from '../../playlist/[id]/EmbedPlaylistPlayer';

const getAlbumData = cache(async (rawId: string) => {
  const itunesId = rawId.replace(/^itunes-album-/, '');
  return await getITunesAlbum(itunesId);
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const album = await getAlbumData(id);

  if (!album) {
    return { title: 'Album Not Found' };
  }

  return {
    title: `${album.title} — ${album.artist || 'Unknown Artist'} | AcadMusic Embed`,
    robots: 'noindex, nofollow',
  };
}

export default async function EmbedAlbumPage({ params }: PageProps) {
  const { id } = await params;
  const album = await getAlbumData(id);

  if (!album) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', width: '100%',
        background: '#080616', color: 'rgba(255,255,255,0.5)',
        fontFamily: 'system-ui, sans-serif', fontSize: '14px'
      }}>
        Album not found
      </div>
    );
  }

  const coverUrl = album.cover_xl || album.cover_big || album.cover || '';
  const albumTracks = album.tracks || [];

  // Map album tracks to the same shape used by EmbedPlaylistPlayer
  const mappedTracks = albumTracks.map(t => ({
    id: t.id,
    name: t.name,
    artistName: t.artists?.primary?.[0]?.name || album.artist || 'Unknown Artist',
    coverUrl: coverUrl, // Album tracks share the same cover
    duration: t.duration,
  }));

  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
      <EmbedPlaylistPlayer
        playlistId={id}
        playlistName={album.title || 'Unknown Album'}
        coverUrl={coverUrl}
        tracks={mappedTracks}
      />
    </main>
  );
}
