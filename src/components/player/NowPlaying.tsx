'use client';

import { GuestNowPlayingUI } from '@/components/player/GuestNowPlayingUI';
import { NowPlayingUI } from '@/components/player/NowPlayingUI';
import { useAuth } from '@/context/AuthContext';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { NowPlayingProps } from "@/types/components/player/NowPlayingProps";

export default function NowPlaying({ isOpen, onClose, isMobile, isDevicesOpen, setIsDevicesOpen }: NowPlayingProps) {
  const state = useNowPlaying(isOpen);
  const { user } = useAuth();

  if (!state.currentTrack) return null;

  if (!user || state.isRadio) {
    return <GuestNowPlayingUI {...state} isOpen={isOpen} onClose={onClose} isMobile={isMobile} isDevicesOpen={isDevicesOpen} setIsDevicesOpen={setIsDevicesOpen} />;
  }

  return <NowPlayingUI {...state} isOpen={isOpen} onClose={onClose} isMobile={isMobile} isDevicesOpen={isDevicesOpen} setIsDevicesOpen={setIsDevicesOpen} />;
}
