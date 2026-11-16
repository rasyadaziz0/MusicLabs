'use client';

import { useTranslation } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { KeyStrokeNormalizer } from '@/lib/shortcuts';
import { DEFAULT_KEYBOARD_SHORTCUTS, KeyboardShortcutsConfig } from '@/types/context/settings';
import { gooeyToast as toast } from 'goey-toast';
import { FastForward, Keyboard, Play, Rewind, RotateCcw, SkipBack, SkipForward, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SectionHeader } from './SettingsUI';

interface ShortcutItem {
  id: keyof KeyboardShortcutsConfig;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function KeyboardShortcutsSettings() {
  const { t } = useTranslation();
  const { settings, updateShortcuts, resetShortcuts } = useSettings();
  const shortcuts = settings.shortcuts || DEFAULT_KEYBOARD_SHORTCUTS;

  const [recordingId, setRecordingId] = useState<keyof KeyboardShortcutsConfig | null>(null);

  const shortcutItems: ShortcutItem[] = [
    {
      id: 'playPause',
      label: t('settings.shortcut_play_pause'),
      description: t('settings.shortcut_play_pause_desc'),
      icon: <Play size={18} className="text-[#FA243C]" />,
    },
    {
      id: 'nextTrack',
      label: t('settings.shortcut_next_track'),
      description: t('settings.shortcut_next_track_desc'),
      icon: <SkipForward size={18} className="text-[#FA243C]" />,
    },
    {
      id: 'prevTrack',
      label: t('settings.shortcut_prev_track'),
      description: t('settings.shortcut_prev_track_desc'),
      icon: <SkipBack size={18} className="text-[#FA243C]" />,
    },
    {
      id: 'forward10',
      label: t('settings.shortcut_forward_10'),
      description: t('settings.shortcut_forward_10_desc'),
      icon: <FastForward size={18} className="text-[#FA243C]" />,
    },
    {
      id: 'rewind10',
      label: t('settings.shortcut_rewind_10'),
      description: t('settings.shortcut_rewind_10_desc'),
      icon: <Rewind size={18} className="text-[#FA243C]" />,
    },
    {
      id: 'closeNowPlaying',
      label: t('settings.shortcut_close_modal'),
      description: t('settings.shortcut_close_modal_desc'),
      icon: <X size={18} className="text-[#FA243C]" />,
    },
  ];

  useEffect(() => {
    if (!recordingId) return;

    const handleRecordKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape' && recordingId !== 'closeNowPlaying') {
        setRecordingId(null);
        toast.info('Perekaman tombol dibatalkan');
        return;
      }

      const formattedKey = KeyStrokeNormalizer.normalizeEvent(e);

      updateShortcuts({ [recordingId]: formattedKey });
      toast.success(`Shortcut "${formattedKey}" berhasil disimpan!`);
      setRecordingId(null);
    };

    window.addEventListener('keydown', handleRecordKey, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleRecordKey, { capture: true });
    };
  }, [recordingId, updateShortcuts]);

  const handleReset = () => {
    resetShortcuts();
    toast.success('Pintasan keyboard berhasil direset ke default!');
  };

  return (
    <>
      <div className="flex items-center justify-between px-1 mb-2.5">
        <SectionHeader title={t('settings.shortcuts')} />
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors active:scale-95"
        >
          <RotateCcw size={13} />
          <span>{t('settings.shortcuts_reset')}</span>
        </button>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8 divide-y divide-white/[0.04]">
        {shortcutItems.map((item) => {
          const currentKey = shortcuts[item.id] || DEFAULT_KEYBOARD_SHORTCUTS[item.id];
          const isRecording = recordingId === item.id;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.015] transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] text-white/90 font-medium">{item.label}</div>
                  <div className="text-[12px] text-white/40 leading-relaxed mt-0.5">{item.description}</div>
                </div>
              </div>

              {/* Shortcut Key Button / Recorder */}
              <div className="flex-shrink-0">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={() => setRecordingId(null)}
                    className="px-4 py-1.5 rounded-lg bg-[#FA243C] text-white font-mono text-[13px] font-semibold animate-pulse shadow-md shadow-[#FA243C]/20 border border-[#FA243C] flex items-center gap-2 cursor-pointer"
                  >
                    <span>Tekan tombol...</span>
                    <span className="text-[10px] opacity-75">(Esc batal)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRecordingId(item.id)}
                    title="Klik untuk mengubah shortcut"
                    className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/[0.12] text-white font-mono text-[13px] font-semibold shadow-sm transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    <Keyboard size={13} className="text-white/40 group-hover:text-white/80 transition-colors" />
                    <span>{KeyStrokeNormalizer.formatDisplay(currentKey)}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
