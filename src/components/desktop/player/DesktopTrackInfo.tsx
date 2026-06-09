import React from 'react';
import { cn } from '@/lib/utils';
import { Radio as RadioIcon, Loader2, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getBestImageUrl } from '@/lib/api/musicApi';

export interface DesktopTrackInfoProps {
  currentTrack: any;
  hasTrack: boolean;
  isRadio: boolean;
  radioMeta: any;
  isResolving: boolean;
  currentTime: number;
  duration: number;
  seek: (val: number) => void;
  setIsNowPlayingOpen: (open: boolean) => void;
}

export default function DesktopTrackInfo({
  currentTrack, hasTrack, isRadio, radioMeta, isResolving,
  currentTime, duration, seek, setIsNowPlayingOpen
}: DesktopTrackInfoProps) {
  return (
    <div className="flex flex-col mx-8 w-[340px] justify-center group">
      {hasTrack ? (
        <>
          <div className="flex items-center gap-3 mb-1">
            <motion.div 
              layoutId={`artwork-${currentTrack.id}`}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ borderRadius: 4 }}
              onClick={() => !isRadio && setIsNowPlayingOpen(true)}
              className="relative w-[34px] h-[34px] overflow-hidden flex-shrink-0 shadow-sm border border-white/5 cursor-pointer group/art"
            >
              {isRadio ? (
                <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/30 to-[#FA243C]/10 flex items-center justify-center">
                  <RadioIcon size={16} className="text-[#FA243C]" />
                </div>
              ) : getBestImageUrl(currentTrack.image) ? (
                <Image src={getBestImageUrl(currentTrack.image)!} alt={currentTrack.name} fill sizes="34px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
              {/* Expand Icon Overlay */}
              {!isRadio && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 transition-opacity duration-200 z-10 flex items-center justify-center">
                  <Maximize2 size={14} className="text-white" />
                </div>
              )}
            </motion.div>
            <div className="flex flex-col min-w-0 flex-1">
              {isRadio ? (
                <>
                  <span className="text-[13px] font-bold text-white truncate leading-tight">
                    {radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
                      ? radioMeta.title
                      : currentTrack.name}
                  </span>
                  <span className="text-[11px] text-[#FA243C]/70 truncate leading-[14px] flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FA243C]" /></span>
                    {radioMeta?.station || currentTrack.name} • Live
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[13px] font-bold text-white truncate leading-tight">
                    {currentTrack.name}
                  </span>
                  {isResolving ? (
                    <span className="text-[11px] text-white/50 truncate leading-[14px] flex items-center gap-1.5">
                      <Loader2 size={10} className="animate-spin flex-shrink-0" />
                      Loading track…
                    </span>
                  ) : (
                    <span className="text-[11px] text-white/70 truncate leading-[14px]">
                      {currentTrack.artists?.primary?.map((a: any) => a.name).join(', ')} {currentTrack.album?.name ? `— ${currentTrack.album.name}` : ''}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Progress Bar — hidden for radio (infinite stream) */}
          {!isRadio ? (
            isResolving ? (
              <div className="w-full h-[2px] bg-white/[0.08] mt-[2px] rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ backgroundSize: '200% 100%' }} />
              </div>
            ) : (
              <div className="w-full h-[2px] bg-white/[0.15] relative mt-[2px] group/progress rounded-full">
                <input type="range" min={0} max={duration || 0} value={currentTime} onChange={(e) => seek(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 hover:h-3 hover:-top-[5px]" />
                <div className="absolute h-full bg-white rounded-full transition-colors group-hover/progress:bg-white" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
              </div>
            )
          ) : (
            <div className="w-full h-[2px] bg-[#FA243C]/20 mt-[2px] rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-[#FA243C]/40 rounded-full animate-pulse" />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-[2px] bg-white/[0.1] mt-8 rounded-full" />
      )}
    </div>
  );
}
