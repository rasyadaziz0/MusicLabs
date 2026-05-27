'use client';

import { useMemo } from 'react';
import { LrcWord } from '@/lib/utils/lrcParser';

export function KaraokeWord({
  word,
  currentTime,
}: {
  word: LrcWord;
  currentTime: number;
}) {
  // Calculate fill progress: 0 = not started, 1 = fully spoken
  const progress = useMemo(() => {
    if (currentTime >= word.endTime) return 1;
    if (currentTime <= word.startTime) return 0;
    const duration = word.endTime - word.startTime;
    if (duration <= 0) return 1;
    return (currentTime - word.startTime) / duration;
  }, [currentTime, word.startTime, word.endTime]);

  const fillPercent = Math.round(progress * 100);

  // Check if word contains RTL characters (Arabic, Hebrew, etc.)
  const isRTL = useMemo(() => {
    return /[\u0590-\u083F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(word.text);
  }, [word.text]);

  // Active color (fully sung) vs inactive
  const activeColor = 'rgba(255,255,255,0.97)';
  const inactiveColor = 'rgba(255,255,255,0.35)';

  if (fillPercent <= 0) {
    // Not reached yet
    return (
      <span style={{ color: inactiveColor, transition: 'color 0.15s ease' }}>
        {word.text}
      </span>
    );
  }

  if (fillPercent >= 100) {
    // Fully sung
    return (
      <span
        style={{
          color: activeColor,
          textShadow: '0 0 20px rgba(255,255,255,0.15)',
          transition: 'color 0.1s ease',
        }}
      >
        {word.text}
      </span>
    );
  }

  // Partially sung — gradient clip sweep
  // 90deg is left-to-right (LTR), -90deg is right-to-left (RTL)
  const angle = isRTL ? '-90deg' : '90deg';

  return (
    <span
      style={{
        backgroundImage: `linear-gradient(${angle}, ${activeColor} ${fillPercent}%, ${inactiveColor} ${fillPercent}%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textShadow: 'none', // Can't have text-shadow with bg-clip
        transition: 'none', // Smooth handled by continuous updates
      }}
    >
      {word.text}
    </span>
  );
}
