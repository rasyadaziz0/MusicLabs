'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { IdentifyPanelPresenter } from '@/lib/identify/IdentifyPanelPresenter';
import type { IIdentifyIdleProps } from '../IdentifyLayoutInterface';

export function IdentifyIdlePanel({ mode, handleAuddIdentify, handleSpeechStart }: IIdentifyIdleProps) {
  const { t } = useTranslation();
  const badgeText = IdentifyPanelPresenter.getIdleBadge(mode, t);
  const titleText = IdentifyPanelPresenter.getIdleTitle(mode, t);
  const descriptionText = IdentifyPanelPresenter.getIdleDescription(mode);

  return (
    <motion.div
      key="idle-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center max-w-md w-full"
    >
      <div className="relative mb-6 group flex items-center justify-center">
        <button
          onClick={mode === 'audd' ? handleAuddIdentify : handleSpeechStart}
          className="relative w-64 h-64 md:w-72 md:h-72 rounded-full bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center shadow-inner hover:bg-white/[0.06] active:scale-95 transition-all outline-none cursor-pointer"
        >
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#0088ff] via-[#a855f7] to-[#ff2d55] shadow-[0_0_50px_rgba(168,85,247,0.4)] flex items-center justify-center relative group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-14 h-14 text-white fill-current drop-shadow-md">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.93 14.33c-1.44.83-3.23.59-4.22-.58l-.06-.07c-.45-.55-.71-1.25-.71-1.98 0-.9.41-1.74 1.12-2.3l1.83-1.43c.5-.39.79-.98.79-1.62 0-.8-.48-1.52-1.22-1.81-.74-.29-1.58-.1-2.14.48l1.91-2.07c.38-.42 1.02-.45 1.44-.07.42.38.45 1.02.07 1.44l-1.92 2.07c-.96.99-2.31 1.43-3.61 1.24z" />
            </svg>
          </div>
          <span className="text-white/55 font-bold text-[11px] mt-5 tracking-[0.2em] uppercase">
            {badgeText}
          </span>
        </button>
      </div>

      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mt-2">
        {titleText}
      </h2>
      <p className="text-white/60 text-[13.5px] leading-relaxed mt-2.5 max-w-[280px] mx-auto font-normal">
        {descriptionText}
      </p>
    </motion.div>
  );
}
