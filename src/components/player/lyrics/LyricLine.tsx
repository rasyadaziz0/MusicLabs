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
  isUserScrolling?: boolean;
  onLineClick: (time: number, isPlaceholder?: boolean) => void;
}

export function LyricLine({
  line,
  index,
  activeIndex,
  isSynced,
  romanText,
  currentTime,
  isUserScrolling = false,
  onLineClick,
}: LyricLineProps) {
  const isActive = activeIndex === index;
  const isPlaceholder = !!line.isPlaceholder;
  const lineStyle = LyricStyleManager.getLineStyle(index, activeIndex, isUserScrolling, isPlaceholder);
  const romanStyle = LyricStyleManager.getRomanizationStyle(
    index,
    activeIndex,
    lineStyle.opacity,
    lineStyle.filter,
    isUserScrolling
  );

  // Apple Music logic: dots only show up when active, or if user is scrolling they show up lightly.
  // Actually, if it's a placeholder, and we want to render dots, we can do it here.
  const renderContent = () => {
    if (isPlaceholder) {
      // The text is probably '...'. Let's render nice pulsing dots if active, or just text if scrolling
      if (!isActive && !isUserScrolling) return null; // handled by opacity=0 in StyleManager, but can also just return null
      return (
        <span style={{ letterSpacing: '4px' }}>● ● ●</span>
      );
    }
    let mainContent;
    if (isActive && isSynced && line.words && line.words.length > 0) {
      mainContent = <KaraokeLine line={line} currentTime={currentTime} />;
    } else {
      mainContent = line.text;
    }

    if (line.bgText) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <span>{mainContent}</span>
          <span style={{ fontSize: '0.65em', opacity: 0.8, letterSpacing: '0px' }}>{line.bgText}</span>
        </div>
      );
    }

    return mainContent;
  };

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
        {renderContent()}
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
