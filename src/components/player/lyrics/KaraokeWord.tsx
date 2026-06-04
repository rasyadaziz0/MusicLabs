'use client';

import { useRef, useEffect, useMemo } from 'react';
import { LrcWord } from '@/lib/utils/lrcParser';
import { KaraokeWordAnimator } from './KaraokeWordAnimator';

/**
 * High-precision karaoke word component.
 *
 * Uses the KaraokeWordAnimator OOP class which subscribes to the ~60fps rAF time loop
 * and updates its gradient fill directly via DOM manipulation to achieve smooth,
 * low-latency karaoke fill tracking.
 */
export function KaraokeWord({ word }: { word: LrcWord }) {
  const spanRef = useRef<HTMLSpanElement>(null);

  const activeColor = 'rgba(255,255,255,0.97)';
  const inactiveColor = 'rgba(255,255,255,0.35)';

  const animator = useMemo(() => {
    return new KaraokeWordAnimator(word, {
      activeColor,
      inactiveColor,
      activeShadow: '0 0 20px rgba(255,255,255,0.15)',
    });
  }, [word, activeColor, inactiveColor]);

  useEffect(() => {
    if (spanRef.current) {
      animator.attach(spanRef.current);
    }
    return () => animator.detach();
  }, [animator]);

  return (
    <span
      ref={spanRef}
      style={{ color: inactiveColor, transition: 'none' }}
    >
      {word.text}
    </span>
  );
}
