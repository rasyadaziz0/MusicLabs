import { Metadata } from 'next';
import { cache } from 'react';
import { trackResolver } from '@/lib/services/TrackPageResolverService';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { createClient } from '@/lib/supabase/server';
import EmbedPlayer from './EmbedPlayer';

const getTrack = cache(async (trackId: string) => {
  return await trackResolver.resolveTrack(trackId);
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrack(id);

  if (!track) {
    return { title: 'Track Not Found' };
  }

  const artistName = track.artists?.primary?.[0]?.name || 'Unknown Artist';

  return {
    title: `${track.name} — ${artistName} | AcadMusic Embed`,
    robots: { index: false, follow: false }, // Don't index embed pages
  };
}

export default async function EmbedTrackPage({ params }: PageProps) {
  const { id } = await params;
  const track = await getTrack(id);

  if (!track) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', width: '100%',
        background: '#080616', color: 'rgba(255,255,255,0.5)',
        fontFamily: 'system-ui, sans-serif', fontSize: '14px'
      }}>
        Track not found
      </div>
    );
  }

  const artistName = track.artists?.primary?.[0]?.name || 'Unknown Artist';
  const coverUrl = getBestImageUrl(track.image) || '';
  const duration = track.duration || 0;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <EmbedPlayer
      trackId={track.id}
      trackName={track.name}
      artistName={artistName}
      coverUrl={coverUrl}
      duration={duration}
      isLoggedIn={isLoggedIn}
      previewUrl={track.preview || ''}
    />
  );
}
