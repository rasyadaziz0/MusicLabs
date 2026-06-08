'use client';

import { useEffect, useRef, useMemo } from 'react';
import { LrcWord } from '@/lib/utils/lrcParser';
import { KaraokeWordAnimator } from './KaraokeWordAnimator';

/* ── Karaoke word (sidebar version — smaller) ── */
export function SidebarKaraokeWord({
  word,
}: {
  word: LrcWord;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);

  const activeColor = 'rgba(255,255,255,1)';
  const inactiveColor = 'rgba(255,255,255,0.35)';

  const animator = useMemo(() => {
    return new KaraokeWordAnimator(word, {
      activeColor,
      inactiveColor,
    });
  }, [word, activeColor, inactiveColor]);

  useEffect(() => {
    if (spanRef.current) {
      animator.attach(spanRef.current);
    }
    return () => animator.detach();
  }, [animator]);

  return (
    <span ref={spanRef} style={{ color: inactiveColor, transition: 'none' }}>
      {word.text}
    </span>
  );
}
