'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getBestImageUrl } from '@/lib/api/musicApi';
import GuestGate from '@/components/auth/GuestGate';
import Image from 'next/image';
import type { NowPlayingUIProps } from '@/components/player/NowPlayingUI';

import { GuestDesktopPlayer } from './GuestDesktopPlayer';
import { GuestMobilePlayer } from './GuestMobilePlayer';

const css = `
  .np-range { position:absolute; inset:-6px 0; width:100%; height:calc(100% + 12px); opacity:0; cursor:pointer; z-index:10; }
  @keyframes spin { to { transform:rotate(360deg) } }
`;

export function GuestNowPlayingUI(props: NowPlayingUIProps) {
  const {
    isOpen, currentTrack, currentTime, duration,
    isGuestGateOpen, guestGateAction, setIsGuestGateOpen, isMobile,
  } = props;

  if (!currentTrack) return null;
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const coverUrl = getBestImageUrl(currentTrack.image);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: isMobile ? '100%' : 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isMobile ? '100%' : 14 }}
          transition={isMobile ? { type: 'spring', damping: 25, stiffness: 200 } : { duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 70, overflow: 'hidden',
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            color: '#fff',
          }}
        >
          <style>{css}</style>

          {/* ── BG: blurred album art ── */}
          <div style={{ position: 'absolute', inset: '-20px', zIndex: 0 }}>
            {coverUrl && <Image src={coverUrl} alt="bg" fill sizes="100vw" style={{ objectFit: 'cover', transform: 'scale(1.15)' }} />}
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(80px) saturate(180%)', WebkitBackdropFilter: 'blur(80px) saturate(180%)', background: 'rgba(0,0,0,0.35)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }} />
          </div>

          {/* ── MAIN CONTENT ── */}
          {!isMobile ? (
            <GuestDesktopPlayer props={props} coverUrl={coverUrl} progress={progress} />
          ) : (
            <GuestMobilePlayer props={props} coverUrl={coverUrl} progress={progress} />
          )}

          {/* Guest Gate Modal */}
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
