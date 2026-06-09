'use client';

import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { getBestImageUrl } from '@/lib/api/musicApi';
import GuestGate from '@/components/auth/GuestGate';
import Image from 'next/image';
import type { NowPlayingUIProps } from '@/components/player/NowPlayingUI';
import { DynamicGradientBackground } from '@/components/player/DynamicGradientBackground';

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

  const dragControls = useDragControls();

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
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.5}
          dragListener={false}
          dragControls={dragControls}
          onDragEnd={(e, { offset, velocity }) => {
            if (isMobile && (offset.y > 100 || velocity.y > 500)) props.onClose?.();
          }}
          style={{
            position: 'fixed', inset: 0, zIndex: 70, overflow: 'hidden',
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            color: '#fff',
          }}
        >
          <style>{css}</style>

          {/* ── BG: blurred album art ── */}
          <DynamicGradientBackground coverUrl={coverUrl} trackId={currentTrack.id} />

          {/* ── MAIN CONTENT ── */}
          {!isMobile ? (
            <GuestDesktopPlayer props={props} coverUrl={coverUrl} progress={progress} />
          ) : (
            <div onPointerDown={(e) => dragControls.start(e)} style={{ height: '100%' }}>
              <GuestMobilePlayer props={props} coverUrl={coverUrl} progress={progress} dragControls={dragControls} />
            </div>
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
