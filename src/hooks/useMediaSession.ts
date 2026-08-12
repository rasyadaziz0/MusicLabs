import { ImageHelper } from '@/lib/utils/ImageHelper';
import { UseMediaSessionProps } from '@/types/hooks/media';
import { useEffect } from 'react';

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
        artwork: [{ src: ImageHelper.getBestImageUrl(currentTrack.image) ?? '', sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
      navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    }
  }, [currentTrack, togglePlay, nextTrack, prevTrack]);
}
