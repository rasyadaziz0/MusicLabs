'use client';

import { motion } from 'framer-motion';
import { LrcLine } from '@/lib/utils/lrcParser';
import { KaraokeLine } from './KaraokeLine';
import { LyricStyleManager } from './LyricStyleManager';


interface LyricLineProps {
  line: LrcLine;
  index: number;
  activeIndex: number;
  isSynced: boolean;
  romanText?: string;
  currentTime: number;
  onLineClick: (time: number, isPlaceholder?: boolean) => void;
}

export function LyricLine({
  line,
  index,
  activeIndex,
  isSynced,
  romanText,
  currentTime,
  onLineClick,
}: LyricLineProps) {
  const isActive = activeIndex === index;
  const lineStyle = LyricStyleManager.getLineStyle(index, activeIndex);
  const romanStyle = LyricStyleManager.getRomanizationStyle(
    index,
    activeIndex,
    lineStyle.opacity,
    lineStyle.filter
  );

  return (
    <div className="lyric-line-wrapper">
      <motion.button
        data-lyric-index={index}
        className={`lyric-line${isSynced && !line.isPlaceholder && !isActive ? ' lyric-line-hoverable' : ''}`}
        animate={lineStyle}
        transition={LyricStyleManager.getLineTransition()}
        onClick={() => onLineClick(line.time, line.isPlaceholder)}
        style={{
          cursor: isSynced && !line.isPlaceholder ? 'pointer' : 'default',
        }}
      >
        {/* Karaoke word glow for active line */}
        {isActive && isSynced && line.words && line.words.length > 0 ? (
          <KaraokeLine line={line} currentTime={currentTime} />
        ) : (
          line.text
        )}
      </motion.button>

      {/* Romanization subtitle */}
      {romanText && (
        <motion.span
          className="romanization-text"
          animate={romanStyle}
          transition={LyricStyleManager.getRomanizationTransition()}
        >
          {romanText}
        </motion.span>
      )}
    </div>
  );
}
