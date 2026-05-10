'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Volume2, Loader2, Heart
} from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime } from '@/lib/utils';
import LyricsUI from '@/components/player/LyricsUI';
import GuestGate from '@/components/auth/GuestGate';
import Image from 'next/image';
import Link from 'next/link';
import type { NowPlayingUIProps } from '@/components/player/NowPlayingUI';
import { MoreMenu } from '@/components/player/NowPlayingUI';

const css = `
  .np-range { position:absolute; inset:-6px 0; width:100%; height:calc(100% + 12px); opacity:0; cursor:pointer; z-index:10; }
  @keyframes spin { to { transform:rotate(360deg) } }
`;

export default function DesktopNowPlayingUI(props: NowPlayingUIProps) {
  const {
    isOpen, onClose, currentTrack, isPlaying, isResolving, isPreview,
    currentTime, duration, volume, togglePlay, nextTrack, prevTrack,
    seek, setVolume, lines, isSynced, isLyricsLoading, activeIndex,
    isLiked, toggleLikeMutation, lyricsScrollRef,
    handleToggleLike,
    isGuestGateOpen, guestGateAction, setIsGuestGateOpen,
  } = props;

  if (!currentTrack) return null;
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const coverUrl = getBestImageUrl(currentTrack.image);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 70, overflow: 'hidden',
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            color: '#fff',
          }}
        >
          <style>{css}</style>

          {/* ── BG: blurred album art ── */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            {coverUrl && <Image src={coverUrl} alt="bg" fill style={{ objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(72px)', WebkitBackdropFilter: 'blur(72px)', background: 'rgba(20,18,28,0.5)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(80,60,110,0.45) 0%, rgba(60,50,80,0.4) 50%, rgba(90,70,55,0.4) 100%)' }} />
          </div>

          {/* ── Close ── */}
          <button onClick={onClose} style={{ position: 'absolute', top: 18, left: 18, zIndex: 20, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            <X size={14} strokeWidth={2.5} />
          </button>

          {/* ── MAIN LAYOUT ── */}
          <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 48px', gap: 56, maxWidth: 1440, margin: '0 auto' }}>

            {/* ══ LEFT: Album + Controls ══ */}
            <div className="w-full max-w-[50vh] md:max-w-md mx-auto lg:mr-0 flex flex-col justify-center pt-8 md:pt-0 pb-16 md:pb-0 px-4 md:px-0 z-10 relative">
              {/* Album art — no card wrapper, MusicLabs style */}
              <motion.div style={{ position: 'relative', aspectRatio: '1', width: '100%', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)', background: '#1a1a2a' }}>
                {coverUrl ? (
                  <Image src={coverUrl} alt={currentTrack.name} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(120,80,160,0.4), rgba(20,20,40,1))' }} />
                )}
                {isPreview && (
                  <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 10px', borderRadius: 999, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>Preview</span>
                )}
              </motion.div>

              {/* Track info + actions */}
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                    {currentTrack.name}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentTrack.artists.primary.map((a, i) => (
                      <span key={a.id}>
                        <Link href={`/artist/${a.id}`} onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>{a.name}</Link>
                        {i < currentTrack.artists.primary.length - 1 && ' — '}
                      </span>
                    ))}
                    {currentTrack.album?.name && ` — ${currentTrack.album.name}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 3, flexShrink: 0 }}>
                  <button onClick={handleToggleLike} disabled={toggleLikeMutation.isPending} style={{ background: 'none', border: 'none', color: isLiked ? '#fa233b' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    {toggleLikeMutation.isPending ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <Heart size={17} fill={isLiked ? 'currentColor' : 'none'} />}
                  </button>
                  <MoreMenu {...props} />
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 18 }}>
                <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <input type="range" className="np-range" min={0} max={duration || 0} value={currentTime} onChange={e => seek(Number(e.target.value))} />
                  <div style={{ position: 'absolute', height: '100%', width: `${progress}%`, background: '#fff', borderRadius: 2 }}>
                    <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>-{formatTime(Math.max((duration || 0) - currentTime, 0))}</span>
                </div>
              </div>

              {/* Playback controls */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
                <button onClick={() => { }} style={{ background: 'none', border: 'none', color: '#e05050', cursor: 'pointer', display: 'flex' }}>
                  <Shuffle size={17} strokeWidth={2.5} />
                </button>
                <button onClick={prevTrack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                  <SkipBack size={26} fill="currentColor" strokeWidth={0} />
                </button>
                <button onClick={togglePlay} disabled={isResolving} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isResolving ? 0.5 : 1 }}>
                  {isResolving ? <Loader2 size={22} color="#111" style={{ animation: 'spin 1s linear infinite' }} /> : isPlaying ? <Pause size={22} fill="#111" color="#111" /> : <Play size={22} fill="#111" color="#111" style={{ marginLeft: 2 }} />}
                </button>
                <button onClick={nextTrack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                  <SkipForward size={26} fill="currentColor" strokeWidth={0} />
                </button>
                <button onClick={() => { }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', display: 'flex' }}>
                  <Repeat size={17} strokeWidth={2.5} />
                </button>
              </div>

              {/* Volume */}
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Volume2 size={14} color="rgba(255,255,255,0.5)" />
                <div style={{ position: 'relative', flex: 1, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                  <input type="range" className="np-range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} />
                  <div style={{ position: 'absolute', height: '100%', width: `${volume * 100}%`, background: '#fff', borderRadius: 2 }} />
                </div>
              </div>
            </div>

            {/* ══ RIGHT: Lyrics ══ */}
            <div className="flex" style={{ flex: 1, alignItems: 'center', overflow: 'hidden', height: '100%' }}>
              <LyricsUI
                currentTrack={currentTrack}
                lines={lines}
                activeIndex={activeIndex}
                isSynced={isSynced}
                isLoading={isLyricsLoading}
                scrollRef={lyricsScrollRef}
                onLineClick={(time, isPlaceholder) => { if (isSynced && !isPlaceholder) seek(time); }}
                hideHeader
              />
            </div>
          </div>

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
