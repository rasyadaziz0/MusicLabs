'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import dynamic from 'next/dynamic';
import type { NowPlayingState } from '@/hooks/useNowPlaying';

export type NowPlayingUIProps = NowPlayingState & {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  isDevicesOpen?: boolean;
  setIsDevicesOpen?: (open: boolean) => void;
};

const MobileNowPlayingUI = dynamic(() => import('@/components/mobile/player/MobileNowPlayingUI'));
const DesktopNowPlayingUI = dynamic(() => import('@/components/desktop/player/DesktopNowPlayingUI'));

export function NowPlayingUI(props: NowPlayingUIProps) {
  if (props.isMobile) {
    return <MobileNowPlayingUI {...props} />;
  }
  return <DesktopNowPlayingUI {...props} />;
}