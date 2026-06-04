'use client';

import { LrcLine } from '@/lib/utils/lrcParser';
import { KaraokeWord } from './KaraokeWord';

export function KaraokeLine({
  line,
  currentTime,
}: {
  line: LrcLine;
  currentTime: number;
}) {
  if (!line.words || line.words.length === 0) {
    return <>{line.text}</>;
  }

  return (
    <>
      {line.words.map((word, i) => (
        <KaraokeWord key={i} word={word} />
      ))}
    </>
  );
}
