'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getBestImageUrl } from '@/lib/api/musicApi';
import GuestGate from '@/components/auth/GuestGate';
import type { NowPlayingUIProps } from '@/components/player/NowPlayingUI';

// Extracted Components
import { mobileNowPlayingCss } from '@/components/mobile/player/MobileNowPlayingStyles';
import { MobileNowPlayingBackground } from '@/components/mobile/player/MobileNowPlayingBackground';
import { MobileLyricsMode } from '@/components/mobile/player/MobileLyricsMode';
import { MobileArtworkMode } from '@/components/mobile/player/MobileArtworkMode';
import { MobilePlayerControls } from '@/components/mobile/player/MobilePlayerControls';

export default function MobileNowPlayingUI(props: NowPlayingUIProps) {
  const {
    isOpen, onClose, currentTrack, isPlaying, isResolving, isPreview,
    currentTime, duration, volume, togglePlay, nextTrack, prevTrack,
    seek, setVolume, lines, isSynced, isLyricsLoading, activeIndex,
    isLiked, toggleLikeMutation,
    isLyricsOpen, setIsLyricsOpen, mobileLyricsScrollRef,
    handleToggleLike,
    isGuestGateOpen, guestGateAction, setIsGuestGateOpen,
  } = props;

  if (!currentTrack) return null;
  const coverUrl = getBestImageUrl(currentTrack.image);
  const artistNames = currentTrack.artists.primary.map((a: any) => a.name).join(', ');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260, mass: 0.9 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 70, overflow: 'hidden',
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            color: '#fff',
            touchAction: 'none',
          }}
        >
          <style>{mobileNowPlayingCss}</style>

          {/* ── BG: blurred artwork ── */}
          <MobileNowPlayingBackground coverUrl={coverUrl} />

          <div style={{
            position: 'relative', zIndex: 10, height: '100%',
            display: 'flex', flexDirection: 'column',
            padding: 'env(safe-area-inset-top, 12px) 28px env(safe-area-inset-bottom, 24px)',
            paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
          }}>

            {/* ── Top: Drag Handle ── */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: isLyricsOpen ? 12 : 20 }}>
              <button
                onClick={onClose}
                aria-label="Close Now Playing"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 20px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 0,
                }}
              >
                <div style={{
                  width: 36, height: 5, borderRadius: 3,
                  background: 'rgba(255,255,255,0.35)',
                }} />
              </button>
            </div>

            {isLyricsOpen ? (
              /* ─────────────── LYRICS MODE ─────────────── */
              <MobileLyricsMode
                currentTrack={currentTrack}
                coverUrl={coverUrl}
                artistNames={artistNames}
                isLiked={isLiked}
                toggleLikeMutation={toggleLikeMutation}
                handleToggleLike={handleToggleLike}
                lines={lines}
                activeIndex={activeIndex}
                isSynced={isSynced}
                isLyricsLoading={isLyricsLoading}
                mobileLyricsScrollRef={mobileLyricsScrollRef}
                seek={seek}
                currentTime={currentTime}
                romanizations={props.romanizations}
                nowPlayingProps={props}
              />
            ) : (
              /* ─────────────── ARTWORK MODE ─────────────── */
              <MobileArtworkMode
                currentTrack={currentTrack}
                coverUrl={coverUrl}
                isPlaying={isPlaying}
                isPreview={isPreview}
                isLiked={isLiked}
                toggleLikeMutation={toggleLikeMutation}
                handleToggleLike={handleToggleLike}
                onClose={onClose}
                nowPlayingProps={props}
              />
            )}

            {/* ═══════════════════════════════════════════
                COMMON BOTTOM CONTROLS
            ═══════════════════════════════════════════ */}
            <MobilePlayerControls
              duration={duration}
              currentTime={currentTime}
              seek={seek}
              prevTrack={prevTrack}
              nextTrack={nextTrack}
              togglePlay={togglePlay}
              isResolving={isResolving}
              isPlaying={isPlaying}
              volume={volume}
              setVolume={setVolume}
              isLyricsOpen={isLyricsOpen}
              setIsLyricsOpen={setIsLyricsOpen}
              linesLength={lines.length}
            />

          </div>

          {/* Guest Gate */}
          <GuestGate
            isOpen={isGuestGateOpen}
            onClose={() => setIsGuestGateOpen(false)}
            action={guestGateAction}
          />

        </motion.div>
      )}
    </AnimatePresence>
  );
}
