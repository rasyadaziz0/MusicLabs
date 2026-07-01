'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import type { IIdentifyHeaderProps } from './IdentifyLayoutInterface';

export function IdentifyHeaderUI({
  mode,
  setMode,
  state,
  speech,
  quota,
  onBack,
}: IIdentifyHeaderProps) {
  const isRecordingOrProcessing = state === 'recording' || state === 'processing';

  return (
    <header className="flex items-center justify-between w-full pb-4 z-20 gap-1.5 sm:gap-3 select-none">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 border border-white/5 flex items-center justify-center text-white/80 active:scale-95 transition-all outline-none flex-shrink-0 shadow-sm"
        title="Kembali"
      >
        <ChevronLeft size={22} strokeWidth={2.2} />
      </button>

      {/* Pill-shaped Segmented Tab Selector */}
      <div className="flex bg-white/10 border border-white/5 rounded-full p-1 shadow-md backdrop-blur-xl flex-shrink min-w-0">
        <button
          onClick={() => setMode('audd')}
          disabled={isRecordingOrProcessing}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-[13px] whitespace-nowrap transition-all active:scale-95 duration-300 outline-none leading-none flex items-center justify-center ${
            mode === 'audd'
              ? 'bg-white text-black font-bold shadow'
              : 'text-white/65 hover:text-white font-medium disabled:opacity-40'
          }`}
        >
          Identify Song
        </button>
        <button
          onClick={() => setMode('speech')}
          disabled={!speech.isSupported || isRecordingOrProcessing}
          className={`px-3 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-[13px] whitespace-nowrap transition-all active:scale-95 duration-300 outline-none leading-none flex items-center justify-center ${
            mode === 'speech'
              ? 'bg-white text-black font-bold shadow'
              : 'text-white/65 hover:text-white font-medium disabled:opacity-40'
          } ${!speech.isSupported ? 'opacity-30' : ''}`}
          title={!speech.isSupported ? 'Speech recognition not supported in this browser' : ''}
        >
          Sing / Say
        </button>
      </div>

      {/* Quota display / mode badge */}
      <div className="flex items-center justify-end flex-shrink-0">
        {mode === 'audd' ? (
          <div className="bg-white/10 border border-white/5 rounded-full px-3 py-1.5 text-[11px] sm:text-[12px] font-mono text-white/85 tracking-tight whitespace-nowrap shadow-sm">
            <span className="text-white font-bold">{quota.remaining}</span> / 300 Left
          </div>
        ) : (
          <div className="bg-[#fc3c44]/10 border border-[#fc3c44]/20 rounded-full px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold text-[#fc3c44] tracking-wider uppercase whitespace-nowrap shadow-sm">
            Unlimited
          </div>
        )}
      </div>
    </header>
  );
}
