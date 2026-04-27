'use client';

import { useNowPlaying } from '@/hooks/useNowPlaying';
import { NowPlayingUI } from '@/components/player/NowPlayingUI';

interface NowPlayingProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NowPlaying({ isOpen, onClose }: NowPlayingProps) {
  const state = useNowPlaying(isOpen);

  if (!state.currentTrack) return null;

  return <NowPlayingUI {...state} isOpen={isOpen} onClose={onClose} />;
}
