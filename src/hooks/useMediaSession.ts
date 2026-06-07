import { useEffect } from 'react';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';

interface UseMediaSessionProps {
  currentTrack: Song | null;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export function useMediaSession({
  currentTrack,
  togglePlay,
  nextTrack,
  prevTrack
}: UseMediaSessionProps) {
  useEffect(() => {
    if (currentTrack && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: currentTrack.artists.primary.map((a: any) => a.name).join(', '),
        album: currentTrack.album?.name || '',
        artwork: [{ src: getBestImageUrl(currentTrack.image) ?? '', sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
      navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    }
  }, [currentTrack, togglePlay, nextTrack, prevTrack]);
}
