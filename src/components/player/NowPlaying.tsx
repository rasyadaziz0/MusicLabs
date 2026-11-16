'use client';

import { GuestNowPlayingUI } from '@/components/player/GuestNowPlayingUI';
import { NowPlayingUI } from '@/components/player/NowPlayingUI';
import { useAuth } from '@/context/AuthContext';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { getPortalRoot } from '@/lib/utils/portalRoot';
import { NowPlayingProps } from "@/types/components/player/NowPlayingProps";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function NowPlaying({ isOpen, onClose, isMobile, isDevicesOpen, setIsDevicesOpen }: NowPlayingProps) {
  const state = useNowPlaying(isOpen);
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!state.currentTrack) return null;

  const content = (!user || state.isRadio || state.isStation) ? (
    <GuestNowPlayingUI {...state} isOpen={isOpen} onClose={onClose} isMobile={isMobile} isDevicesOpen={isDevicesOpen} setIsDevicesOpen={setIsDevicesOpen} />
  ) : (
    <NowPlayingUI {...state} isOpen={isOpen} onClose={onClose} isMobile={isMobile} isDevicesOpen={isDevicesOpen} setIsDevicesOpen={setIsDevicesOpen} />
  );

  if (!mounted) return content;
  const portalRoot = getPortalRoot();
  return portalRoot ? createPortal(content, portalRoot) : content;
}
