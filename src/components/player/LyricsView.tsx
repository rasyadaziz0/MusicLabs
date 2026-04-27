'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useLyrics } from '@/hooks/useLyrics';
import { useLyricsScroll } from '@/hooks/useLyricsScroll';
import LyricsUI from './LyricsUI';

export default function LyricsView({ onClose }: { onClose?: () => void }) {
  const { currentTrack, currentTime, seek } = usePlayer();
  const { lines, isSynced, isLoading } = useLyrics(currentTrack);
  const { activeIndex, scrollRef } = useLyricsScroll({ lines, isSynced, currentTime });

  if (!currentTrack) return null;

  const handleLineClick = (time: number, isPlaceholder?: boolean) => {
    if (isSynced && !isPlaceholder) seek(time);
  };

  return (
    <LyricsUI
      currentTrack={currentTrack}
      lines={lines}
      activeIndex={activeIndex}
      isSynced={isSynced}
      isLoading={isLoading}
      scrollRef={scrollRef}
      onLineClick={handleLineClick}
    />
  );
}

