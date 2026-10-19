'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Music } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { IdentifyPanelPresenter } from '@/lib/identify/IdentifyPanelPresenter';
import type { IIdentifyFeedbackProps } from '../IdentifyLayoutInterface';

export function IdentifyFeedbackPanel({
  state,
  mode,
  speech,
  rawMatch,
  errorMessage,
  resetState,
  handleSearchForSong,
}: IIdentifyFeedbackProps) {
  const { t } = useTranslation();
  const noMatchText = IdentifyPanelPresenter.getNoMatchDescription(mode, speech.transcript);
  const errorText = IdentifyPanelPresenter.getErrorMessage(errorMessage);
  const canManualSearch = IdentifyPanelPresenter.canManualSearch(mode, rawMatch?.title);

  return (
    <motion.div
      key="feedback-panel"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180 }}
      className="w-full max-w-3xl flex flex-col items-center justify-center"
    >
      {state === 'no-match' && (
        <div className="w-full max-w-md bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-3xl text-center shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Music size={36} className="text-white/30" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">{t('identify.no_match')}</h2>
          <p className="text-white/60 text-base mb-6 leading-relaxed">
            {noMatchText}
          </p>

          {rawMatch?.title && (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left mb-8">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-1">Raw Matches Heard</p>
              <p className="text-white font-bold text-base">{rawMatch.title}</p>
              {rawMatch.artist && <p className="text-white/50 text-sm mt-0.5">by {rawMatch.artist}</p>}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={resetState}
              className="py-4 rounded-full bg-[#fc3c44] text-white font-extrabold text-base hover:bg-[#fc3c44]/90 active:scale-95 transition-all shadow-xl shadow-[#fc3c44]/20 outline-none"
            >
              {t('identify.try_again')}
            </button>
            {canManualSearch && rawMatch?.title && (
              <button
                onClick={() => handleSearchForSong(rawMatch.title, rawMatch.artist || '')}
                className="py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-base active:scale-95 transition-all outline-none"
              >
                Search Manual on AcadMusic
              </button>
            )}
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="w-full max-w-md bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-3xl text-center shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Identification Failed</h2>
          <p className="text-red-300/80 text-sm bg-red-500/5 border border-red-500/10 p-4 rounded-2xl mb-6 leading-relaxed">
            {errorText}
          </p>

          <button
            onClick={resetState}
            className="w-full py-4 rounded-full bg-[#fc3c44] text-white font-extrabold text-base hover:bg-[#fc3c44]/90 active:scale-95 transition-all shadow-xl shadow-[#fc3c44]/20 outline-none"
          >
            {t('identify.try_again')}
          </button>
        </div>
      )}
    </motion.div>
  );
}
