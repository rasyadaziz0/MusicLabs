'use client';

import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import { useTranslation } from '@/context/LanguageContext';
import { useNowPlayingCardController } from '@/hooks/profile/useNowPlayingCardController';
import { NowPlayingCardPresenter } from '@/lib/profile/NowPlayingCardPresenter';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MoreHorizontal, Music2, Play } from 'lucide-react';
import Image from 'next/image';

interface NowPlayingCardProps {
  userId: string;
}

/**
 * Pure UI View: Shows what another user is currently listening to.
 * Presentation & state lifecycle are decoupled via NowPlayingCardPresenter & useNowPlayingCardController.
 */
export default function NowPlayingCard({ userId }: NowPlayingCardProps) {
  const { t } = useTranslation();
  const {
    presence,
    isLoading,
    contextMenuTrack,
    menuPosition,
    menuButtonRef,
    handlePlayClick,
    handleMoreClick,
    handleCloseContextMenu,
  } = useNowPlayingCardController({ userId });

  const coverUrl = NowPlayingCardPresenter.getCoverUrl(presence);
  const trackName = NowPlayingCardPresenter.getTrackName(presence);
  const artistName = NowPlayingCardPresenter.getArtistName(presence);

  return (
    <>
      <AnimatePresence>
        {presence && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            onClick={handlePlayClick}
            className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] backdrop-blur-lg max-w-sm mx-auto mt-4 cursor-pointer transition-all shadow-lg hover:shadow-xl relative"
          >
            {/* Artwork */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={trackName}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={18} className="text-white/20" />
                </div>
              )}

              {/* Play / Loading Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {isLoading ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <Play size={20} className="text-white fill-white translate-x-[1px]" />
                )}
              </div>

              {/* Animated equalizer bars (hidden on hover so Play icon shows) */}
              <div className="absolute bottom-1 right-1 flex items-end gap-[2px] opacity-100 group-hover:opacity-0 transition-opacity bg-black/40 p-1 rounded-md backdrop-blur-sm">
                <span className="w-[3px] bg-[#FA243C] rounded-full animate-eq-1" style={{ height: 8 }} />
                <span className="w-[3px] bg-[#FA243C] rounded-full animate-eq-2" style={{ height: 12 }} />
                <span className="w-[3px] bg-[#FA243C] rounded-full animate-eq-3" style={{ height: 6 }} />
              </div>
            </div>

            {/* Track info */}
            <div className="min-w-0 flex-1 pr-6">
              <p className="text-[10px] font-semibold text-[#FA243C] uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                {t('profile.now_playing')}
              </p>
              <p className="text-[14px] font-semibold text-white truncate leading-tight group-hover:text-[#FA243C] transition-colors">
                {trackName}
              </p>
              <p className="text-[12px] text-white/40 truncate mt-0.5">
                {artistName}
              </p>
            </div>

            {/* Context Menu Button */}
            <button
              ref={menuButtonRef}
              onClick={handleMoreClick}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <TrackContextMenu
        track={contextMenuTrack}
        isOpen={!!menuPosition}
        position={menuPosition}
        onClose={handleCloseContextMenu}
      />
    </>
  );
}
