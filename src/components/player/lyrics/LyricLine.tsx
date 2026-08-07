'use client';

import { motion } from 'framer-motion';
import { LrcLine } from '@/types/utils/lrc';
import { LyricStyleManager } from './LyricStyleManager';
import { KaraokeLine } from './KaraokeLine';

import React from 'react';

import { LyricLineProps } from '@/types/components/player/lyrics/LyricLineProps';
export const LyricLine = React.memo(function LyricLine({
  line,
  index,
  activeIndex,
  isSynced,
  romanText,
  currentTime,
  isUserScrolling = false,
  trackId,
  onLineClick,
}: LyricLineProps) {
  const isActive = activeIndex === index;
  const isPlaceholder = !!line.isPlaceholder;
  const hidePlaceholder = isPlaceholder && !isActive;
  const lineStyle = LyricStyleManager.getLineStyle(index, activeIndex, isUserScrolling, isPlaceholder);
  const romanStyle = LyricStyleManager.getRomanizationStyle(
    index,
    activeIndex,
    lineStyle.opacity,
    lineStyle.filter,
    isUserScrolling
  );

  const romanLine = React.useMemo(() => {
    if (!romanText || !((isActive || isPlaceholder) && line.words && line.words.length > 0)) {
      return null;
    }
    const romanWordsMatch = romanText.match(/\S+\s*/g);
    if (!romanWordsMatch || romanWordsMatch.length === 0) return null;

    let mappedWords = [];
    if (romanWordsMatch.length === line.words.length) {
      mappedWords = romanWordsMatch.map((rw, i) => ({
        text: rw,
        startTime: line.words![i].startTime,
        endTime: line.words![i].endTime,
      }));
    } else {
      const totalChars = romanText.length;
      const totalDuration = (line.words[line.words.length - 1].endTime ?? 0) - line.words[0].startTime;
      let currentStartTime = line.words[0].startTime;
      mappedWords = romanWordsMatch.map((rw) => {
        const durationRatio = rw.length / totalChars;
        const duration = totalDuration * durationRatio;
        const wordObj = {
          text: rw,
          startTime: currentStartTime,
          endTime: currentStartTime + duration,
        };
        currentStartTime += duration;
        return wordObj;
      });
    }

    return {
      time: line.time,
      text: romanText,
      isPlaceholder: false,
      words: mappedWords
    } as LrcLine;
  }, [romanText, isActive, isPlaceholder, line.words, line.time]);

  const renderContent = () => {
    const mainContent = ((isActive || isPlaceholder) && line.words) ? (
      <KaraokeLine line={line} currentTime={currentTime} isActive={isActive} />
    ) : (
      line.text
    );

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
    <motion.div 
      className="lyric-line-wrapper"
      animate={{
        height: hidePlaceholder ? 0 : 'auto',
        marginBottom: hidePlaceholder ? 0 : 20,
        opacity: hidePlaceholder ? 0 : 1
      }}
      initial={false}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{ overflow: 'hidden' }}
    >
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
        <motion.div
          className="romanization-text"
          animate={romanStyle}
          transition={LyricStyleManager.getRomanizationTransition()}
          style={{ width: '100%' }}
        >
          {romanLine ? (
            <KaraokeLine line={romanLine} currentTime={currentTime} isActive={isActive} />
          ) : (
            <span>{romanText}</span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
});
