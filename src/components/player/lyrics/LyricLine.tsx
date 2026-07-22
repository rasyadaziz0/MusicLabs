'use client';

import { motion } from 'framer-motion';
import { LrcLine } from '@/lib/utils/lrcParser';
import { LyricStyleManager } from './LyricStyleManager';
import { KaraokeLine } from './KaraokeLine';


interface LyricLineProps {
  line: LrcLine;
  index: number;
  activeIndex: number;
  isSynced: boolean;
  romanText?: string;
  currentTime: number;
  isUserScrolling?: boolean;
  trackId: string | null;
  onLineClick: (time: number, isPlaceholder?: boolean) => void;
}

import React from 'react';

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
          {(() => {
            if ((isActive || isPlaceholder) && line.words && line.words.length > 0) {
              const romanWordsMatch = romanText.match(/\S+\s*/g);
              
              if (romanWordsMatch && romanWordsMatch.length > 0) {
                let mappedWords = [];

                if (romanWordsMatch.length === line.words.length) {
                  // 1-to-1 match
                  mappedWords = romanWordsMatch.map((rw, i) => ({
                    text: rw,
                    startTime: line.words![i].startTime,
                    endTime: line.words![i].endTime,
                  }));
                } else {
                  // Fallback: character-length proportional mapping
                  const totalChars = romanText.length;
                  const totalDuration = (line.words[line.words.length - 1].endTime ?? 0) - line.words[0].startTime;
                  
                  let currentStartTime = line.words[0].startTime;
                  mappedWords = romanWordsMatch.map((rw, i) => {
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

                const romanLine: LrcLine = {
                  time: line.time,
                  text: romanText,
                  isPlaceholder: false,
                  words: mappedWords
                };

                return <KaraokeLine line={romanLine} currentTime={currentTime} isActive={isActive} />;
              }
            }
            return <span>{romanText}</span>;
          })()}
        </motion.div>
      )}
    </motion.div>
  );
});
