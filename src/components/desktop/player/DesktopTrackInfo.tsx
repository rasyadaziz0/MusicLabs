import React from 'react';
import { cn } from '@/lib/utils';
import { Radio as RadioIcon, Loader2, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { gooeyToast as toast } from 'goey-toast';
import { MoreHorizontal, Share, Link2, Timer } from 'lucide-react';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import { formatTime } from '@/lib/utils';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';
import { usePlayer } from '@/context/PlayerContext';
import { SleepTimerCountdown } from '@/components/player/SleepTimerCountdown';


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
  isVolumeSliderOpen?: boolean;
}

export default function DesktopTrackInfo({
  currentTrack, hasTrack, isRadio, radioMeta, isResolving,
  currentTime, duration, seek, setIsNowPlayingOpen, isVolumeSliderOpen
}: DesktopTrackInfoProps) {
  const { setSleepTimer, clearSleepTimer, sleepTimerEndTime } = usePlayer();
  const [isMenuOpen, React_setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = React.useState<{ x: number; y: number } | null>(null);



  const handleShare = () => {
    if (!currentTrack?.album?.id) return;
    navigator.clipboard.writeText(`${window.location.origin}/album/${currentTrack.album.id}`);
    toast.success('Album link copied to clipboard!', {
      description: 'You can now share this album anywhere.'
    });
    React_setIsMenuOpen(false);
  };

  const handleCopyLink = () => {
    if (!currentTrack) return;
    navigator.clipboard.writeText(`${window.location.origin}/search?q=${encodeURIComponent(currentTrack.name)}`);
    toast.success('Song search link copied!', {
      description: 'You can now share this track anywhere.'
    });
    React_setIsMenuOpen(false);
  };

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
                      {currentTrack.artists?.primary?.map((a: any, i: number) => (
                        <span 
                          key={a.id}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link 
                            href={`/artist/${a.id}`} 
                            className="hover:underline hover:text-white transition-colors"
                          >
                            {a.name}
                          </Link>
                          {i < currentTrack.artists.primary.length - 1 && ', '}
                        </span>
                      ))}
                      {currentTrack.album?.name && currentTrack.album?.id && (
                        <>
                          {' — '}
                          <Link 
                            href={`/album/${currentTrack.album.id}`} 
                            className="hover:underline hover:text-white transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {currentTrack.album.name}
                          </Link>
                        </>
                      )}
                      {currentTrack.album?.name && !currentTrack.album?.id && (
                        ` — ${currentTrack.album.name}`
                      )}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Three Dots Menu */}
            {!isRadio && (
              <div 
                className={cn(
                  "relative flex items-center justify-center pl-2 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  isVolumeSliderOpen ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
                )} 
                ref={menuRef}
              >
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    if (!hasTrack) return;
                    if (isMenuOpen) {
                      React_setIsMenuOpen(false);
                      setMenuPosition(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({ x: rect.right, y: rect.top - 10 });
                      React_setIsMenuOpen(true);
                    }
                  }}
                  className={cn("transition-colors flex-shrink-0", hasTrack ? (isMenuOpen ? "text-white" : "text-white/50 hover:text-white/90") : "text-white/15 pointer-events-none")}
                >
                  <MoreHorizontal size={18} strokeWidth={2.5} />
                </button>

                <TrackContextMenu
                  track={currentTrack}
                  isOpen={isMenuOpen}
                  position={menuPosition}
                  onClose={() => {
                    React_setIsMenuOpen(false);
                    setMenuPosition(null);
                  }}
                  showPlayerControls={true}
                />
              </div>
            )}
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
