import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Song } from '@/types/music';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useLikedSongsIndex } from '@/hooks/library/useLikedSongsIndex';
import { useToggleLikedSong } from '@/hooks/library/useToggleLikedSong';
import { useIsMobile } from '@/hooks/useIsMobile';
import { gooeyToast as toast } from 'goey-toast';
import { resolveToYoutubeId } from '@/lib/youtube';
import { TrackContextMenuPresenter } from '@/lib/track/TrackContextMenuPresenter';

export interface UseTrackContextMenuControllerParams {
  track: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export function useTrackContextMenuController({
  track,
  isOpen,
  onClose,
}: UseTrackContextMenuControllerParams) {
  const router = useRouter();
  // Ensure all hooks are invoked at top-level unconditionally
  const isMobile = useIsMobile();
  const { user, signInWithGoogle } = useAuth();
  const {
    playNext,
    addToQueue,
    playTrack,
    isAutoplayEnabled,
    toggleAutoplay,
    setSleepTimer,
    clearSleepTimer,
    sleepTimerEndTime,
  } = usePlayer();

  const { likedSet } = useLikedSongsIndex();
  const toggleLikeMutation = useToggleLikedSong();
  const isLiked = track ? likedSet.has(track.id) : false;
  const [showPlaylists, setShowPlaylists] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowPlaylists(false);
    }
  }, [isOpen]);

  const runAction = async (action: () => void | Promise<void>) => {
    await action();
    if (!showPlaylists) {
      onClose();
    }
  };

  const handlePlayNext = () => {
    if (!track) return;
    runAction(() => playNext(track));
  };

  const handleAddToQueue = () => {
    if (!track) return;
    runAction(() => addToQueue(track));
  };

  const handleToggleLike = async () => {
    if (!track) return;
    if (!user) {
      await signInWithGoogle();
      return;
    }
    toggleLikeMutation.mutate(track.id);
    onClose();
  };

  const handleShare = async () => {
    if (!track) return;
    const shareData = TrackContextMenuPresenter.getShareData(track);
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success('Link copied to clipboard', {
        description: 'You can now share this track anywhere.',
      });
    }
    onClose();
  };

  const handleCopyLink = () => {
    if (!track) return;
    const url = TrackContextMenuPresenter.getTrackUrl(track);
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
    onClose();
  };

  const handleCopyEmbedCode = () => {
    if (!track) return;
    const iframe = TrackContextMenuPresenter.getEmbedCode(track);
    navigator.clipboard.writeText(iframe);
    toast.success('Embed code copied', {
      description: 'Paste into any website to embed this track.',
    });
    onClose();
  };

  const handleCreateStation = async () => {
    if (!track) return;
    toast.promise(
      (async () => {
        let videoId = track.id;
        if (!videoId.startsWith('yt-')) {
          const resolved = await resolveToYoutubeId(
            track.name,
            track.artists.primary[0]?.name || '',
            track.id
          );
          if (resolved) videoId = resolved;
        } else {
          videoId = videoId.replace('yt-', '');
        }

        const titleParams = new URLSearchParams({
          title: track.name,
          artist: track.artists.primary[0]?.name || '',
          userId: user?.id || 'anonymous',
        });

        const baseUrl =
          process.env.NEXT_PUBLIC_MUSIC_API_URL ||
          process.env.NEXT_PUBLIC_YTMUSIC_API_URL ||
          process.env.NEXT_PUBLIC_EXPRESS_API_URL ||
          '';

        const res = await fetch(`${baseUrl}/api/audio/related/${videoId}?${titleParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch station tracks');

        const data = await res.json();
        const suggestions: Song[] = data.songs || [];
        if (!suggestions || suggestions.length === 0) {
          throw new Error('No similar tracks found');
        }

        const taggedSuggestions = suggestions.map((s) => ({ ...s, isAutoplay: true }));
        playTrack(track, [track, ...taggedSuggestions]);

        if (!isAutoplayEnabled) {
          toggleAutoplay();
        }

        return 'Station created';
      })(),
      {
        loading: 'Creating station...',
        success: (msg) => msg,
        error: 'Failed to create station',
      }
    );
    onClose();
  };

  const handleGoToAlbum = () => {
    if (!track) return;
    runAction(() => router.push(TrackContextMenuPresenter.getAlbumUrl(track)));
  };

  const handleGoToArtist = () => {
    if (!track) return;
    runAction(() => router.push(TrackContextMenuPresenter.getArtistUrl(track)));
  };

  return {
    isMobile,
    isLiked,
    showPlaylists,
    setShowPlaylists,
    sleepTimerEndTime,
    setSleepTimer,
    clearSleepTimer,
    handlePlayNext,
    handleAddToQueue,
    handleToggleLike,
    handleShare,
    handleCopyLink,
    handleCopyEmbedCode,
    handleCreateStation,
    handleGoToAlbum,
    handleGoToArtist,
  };
}
