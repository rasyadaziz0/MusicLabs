'use client';

import { DynamicGradientBackground } from '@/components/player/DynamicGradientBackground';
import { MobileNowPlayingBackgroundProps } from '@/types/components/mobile/player/MobileNowPlayingBackgroundProps';
export function MobileNowPlayingBackground({ coverUrl, trackId }: MobileNowPlayingBackgroundProps) {
  return (
    <DynamicGradientBackground 
      coverUrl={coverUrl} 
      trackId={trackId}
    />
  );
}
