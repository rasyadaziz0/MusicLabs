import React from 'react';
import { Timer } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { ContextMenuDivider } from './ContextMenuItem';

export interface TrackSleepTimerMenuProps {
  sleepTimerEndTime: number | null;
  onSetTimer: (minutes: number) => void;
  onClearTimer: () => void;
  onClose: () => void;
}

export function TrackSleepTimerMenu({
  sleepTimerEndTime,
  onSetTimer,
  onClearTimer,
  onClose,
}: TrackSleepTimerMenuProps) {
  const { t } = useTranslation();

  return (
    <>
      <ContextMenuDivider />
      <div className="px-3 py-2">
        <div className="text-[12px] text-white/50 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Timer size={14} /> {t('context_menu.sleep_timer')}
          </div>
          {sleepTimerEndTime && <span className="text-white/80 font-medium">{t('context_menu.active')}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[15, 30, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => {
                onSetTimer(mins);
                onClose();
              }}
              className="flex-1 text-[11px] bg-white/10 hover:bg-white/20 text-white px-1 py-1 rounded transition-colors text-center"
            >
              {mins}m
            </button>
          ))}
          {sleepTimerEndTime && (
            <button
              onClick={() => {
                onClearTimer();
                onClose();
              }}
              className="w-full mt-1.5 text-[11px] bg-[#FA243C]/20 hover:bg-[#FA243C]/40 text-[#FA243C] py-1.5 rounded transition-colors"
            >
              {t('context_menu.cancel_timer')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
