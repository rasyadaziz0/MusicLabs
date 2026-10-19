import { useState, useEffect, useRef } from 'react';
import { PresenceData } from '@/types/components/profile/PresenceData';
import { Song } from '@/types/music';
import { usePlayer } from '@/context/PlayerContext';
import { MusicApiService } from '@/lib/api/MusicApiService';
import { PresenceRepository } from '@/lib/supabase/repositories/PresenceRepository';
import { IPresenceRepository } from '@/types/repositories/IPresenceRepository';
import { NowPlayingCardPresenter } from '@/lib/profile/NowPlayingCardPresenter';
import { gooeyToast as toast } from 'goey-toast';

export interface UseNowPlayingCardControllerOptions {
  userId: string;
  presenceRepository?: IPresenceRepository;
}

export function useNowPlayingCardController({
  userId,
  presenceRepository = PresenceRepository.getInstance(),
}: UseNowPlayingCardControllerOptions) {
  const [presence, setPresence] = useState<PresenceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenuTrack, setContextMenuTrack] = useState<Song | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const { playTrack } = usePlayer();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPresence = async () => {
      const data = await presenceRepository.getPresence(userId);
      if (!mounted) return;

      if (data?.track_id && NowPlayingCardPresenter.isPresenceFresh(data.updated_at)) {
        setPresence(data);
      } else {
        setPresence(null);
      }
    };

    fetchPresence();

    const unsubscribe = presenceRepository.subscribePresence(userId, (newPresence) => {
      if (!mounted) return;
      if (!newPresence || !newPresence.track_id) {
        setPresence(null);
      } else {
        setPresence(newPresence);
      }
    });

    // Fallback polling every 60 seconds (in case realtime connection drops)
    const interval = setInterval(fetchPresence, 60_000);

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [userId, presenceRepository]);

  const handlePlayClick = async () => {
    if (!presence?.track_id || isLoading) return;

    setIsLoading(true);
    try {
      const song = await MusicApiService.getSong(presence.track_id);
      playTrack(song);
    } catch (error) {
      console.error('Failed to fetch song:', error);
      toast.error('Gagal memutar lagu ini');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoreClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!presence?.track_id || isLoading) return;

    const rect = menuButtonRef.current?.getBoundingClientRect();
    const pos = NowPlayingCardPresenter.calculateMenuPosition(rect, { x: e.clientX, y: e.clientY });

    setIsLoading(true);
    try {
      const song = await MusicApiService.getSong(presence.track_id);
      setContextMenuTrack(song);
      setMenuPosition(pos);
    } catch (error) {
      console.error('Failed to fetch song for menu:', error);
      toast.error('Gagal memuat detail lagu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseContextMenu = () => {
    setMenuPosition(null);
    setTimeout(() => setContextMenuTrack(null), 200);
  };

  return {
    presence,
    isLoading,
    contextMenuTrack,
    menuPosition,
    menuButtonRef,
    handlePlayClick,
    handleMoreClick,
    handleCloseContextMenu,
  };
}
