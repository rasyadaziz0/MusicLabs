'use client';

import { useNowPlaying } from '@/hooks/useNowPlaying';
import { NowPlayingUI } from '@/components/player/NowPlayingUI';
import { GuestNowPlayingUI } from '@/components/player/GuestNowPlayingUI';
import { useAuth } from '@/context/AuthContext';

interface NowPlayingProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export default function NowPlaying({ isOpen, onClose, isMobile }: NowPlayingProps) {
  const state = useNowPlaying(isOpen);
  const { user } = useAuth();

  if (!state.currentTrack) return null;

  if (!user || state.isRadio) {
    return <GuestNowPlayingUI {...state} isOpen={isOpen} onClose={onClose} isMobile={isMobile} />;
  }

  return <NowPlayingUI {...state} isOpen={isOpen} onClose={onClose} isMobile={isMobile} />;
}
