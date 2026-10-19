'use client';

import { motion } from 'framer-motion';
import { AudioLines, Mic } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { IdentifyPanelPresenter } from '@/lib/identify/IdentifyPanelPresenter';
import type { IIdentifyRecordingProps } from '../IdentifyLayoutInterface';
import { WaveformBar } from './WaveformBar';

export function IdentifyRecordingPanel({
  mode,
  countdownPercent,
  recorder,
  speech,
  handleCancel,
}: IIdentifyRecordingProps) {
  const { t } = useTranslation();
  const strokeOffset = IdentifyPanelPresenter.calculateStrokeDashOffset(countdownPercent);
  const badgeText = IdentifyPanelPresenter.getRecordingBadge(mode, t);
  const titleText = IdentifyPanelPresenter.getRecordingTitle(mode, t);
  const secondsStatus = IdentifyPanelPresenter.getRecordingSecondsStatus(recorder.secondsLeft);

  return (
    <motion.div
      key="recording-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center max-w-md w-full"
    >
      <div className="relative mb-6 flex items-center justify-center">
        <svg className="absolute inset-0 w-64 h-64 md:w-72 md:h-72 -rotate-90 m-auto">
          <circle cx="50%" cy="50%" r="47%" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="4" fill="transparent" />
          <motion.circle
            cx="50%"
            cy="50%"
            r="47%"
            stroke="#a855f7"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={IdentifyPanelPresenter.TOTAL_STROKE_CIRCUMFERENCE}
            initial={{ strokeDashoffset: IdentifyPanelPresenter.TOTAL_STROKE_CIRCUMFERENCE }}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ ease: 'linear' }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-64 h-64 rounded-full bg-purple-500/20 blur-[2px]"
          />
        </div>

        <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center shadow-inner">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#0088ff] via-[#a855f7] to-[#ff2d55] shadow-[0_0_50px_rgba(168,85,247,0.6)] flex items-center justify-center animate-pulse">
            {mode === 'audd' ? (
              <AudioLines size={44} className="text-white animate-bounce" />
            ) : (
              <Mic size={44} className="text-white animate-bounce" />
            )}
          </div>
          <span className="text-white/70 font-bold text-[11px] mt-5 tracking-[0.2em] uppercase animate-pulse">
            {badgeText}
          </span>
        </div>
      </div>

      <div className="h-28 flex flex-col items-center justify-start">
        <h3 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          {titleText}
        </h3>

        {mode === 'audd' ? (
          <p className="text-white/50 text-sm font-mono tracking-widest uppercase">
            {secondsStatus}
          </p>
        ) : (
          <div className="w-full max-w-sm px-6">
            {speech.transcript ? (
              <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[#fc3c44] font-medium text-lg italic truncate">
                &ldquo;{speech.transcript}&rdquo;
              </motion.p>
            ) : (
              <p className="text-white/40 text-sm animate-pulse">Speak clearly into your microphone</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center h-12 mb-8">
        <WaveformBar delay={0.0} />
        <WaveformBar delay={0.15} />
        <WaveformBar delay={0.3} />
        <WaveformBar delay={0.45} />
        <WaveformBar delay={0.1} />
        <WaveformBar delay={0.25} />
        <WaveformBar delay={0.4} />
      </div>

      <button
        onClick={handleCancel}
        className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm tracking-wide active:scale-95 transition-all shadow-md outline-none"
      >
        {t('common.cancel')}
      </button>
    </motion.div>
  );
}
