'use client';

import { DynamicGradientBackground } from '@/components/player/DynamicGradientBackground';

export interface MobileNowPlayingBackgroundProps {
  coverUrl: string | null;
  trackId: string | null;
}


export function MobileNowPlayingBackground({ coverUrl, trackId }: MobileNowPlayingBackgroundProps) {
  return (
    <DynamicGradientBackground 
      coverUrl={coverUrl} 
      trackId={trackId}
    />
  );
}
