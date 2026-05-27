'use client';

import { Loader2, Pause, Play, Radio as RadioIcon, SkipForward } from 'lucide-react';
import Image from 'next/image';
import { getBestImageUrl } from '@/lib/api/musicApi';

export interface MobilePlayerBarProps {
  currentTrack: any;
  isPlaying: boolean;
  isResolving: boolean;
  isGuestPreview: boolean;
  isRadio: boolean;
  radioMeta: any;
  togglePlay: () => void;
  nextTrack: () => void;
  setIsNowPlayingOpen: (open: boolean) => void;
}

export default function MobilePlayerBar({
  currentTrack,
  isPlaying,
  isResolving,
  isGuestPreview,
  isRadio,
  radioMeta,
  togglePlay,
  nextTrack,
  setIsNowPlayingOpen
}: MobilePlayerBarProps) {
  if (!currentTrack) return null;

  return (
    <div
      className="md:hidden fixed bottom-[104px] left-4 right-4 h-[60px] bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center px-3 gap-3 z-40 cursor-pointer"
      onClick={() => setIsNowPlayingOpen(true)}
    >
      <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
        {isRadio ? (
          <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/30 to-[#FA243C]/10 flex items-center justify-center">
            <RadioIcon size={20} className="text-[#FA243C]" />
          </div>
        ) : getBestImageUrl(currentTrack.image) ? (
          <Image
            src={getBestImageUrl(currentTrack.image)!}
            alt={currentTrack.name}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
        )}
      </div>
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
        {isRadio && (
          <p className="text-[9px] text-[#FA243C] font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FA243C]" /></span>
            Live Radio
          </p>
        )}
        {!isRadio && isResolving && (
          <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <Loader2 size={8} className="animate-spin" />
            Loading track…
          </p>
        )}
        {!isRadio && !isResolving && isGuestPreview && (
          <p className="text-[9px] text-[#FA243C] font-semibold uppercase tracking-wider mb-0.5">
            Preview
          </p>
        )}
        {!isRadio && !isResolving && !isGuestPreview && (
          <p className="text-[9px] text-white/60 font-medium uppercase tracking-wider mb-0.5">
            High Quality Audio
          </p>
        )}
        <p className="text-[15px] font-bold truncate text-white leading-tight">
          {isRadio && radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
            ? radioMeta.title
            : currentTrack.name}
        </p>
      </div>
      <div className="flex items-center gap-4 pl-2 text-white pr-2">
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          disabled={isResolving}
          className="hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isResolving ? (
            <Loader2 size={24} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={24} fill="currentColor" />
          ) : (
            <Play size={24} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextTrack(); }}
          className="hover:scale-105 transition-transform"
        >
          <SkipForward size={24} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
