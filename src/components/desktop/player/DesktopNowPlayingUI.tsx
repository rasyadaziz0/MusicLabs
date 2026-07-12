'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Volume2, Loader2, Heart, Ellipsis
} from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime } from '@/lib/utils';
import LyricsUI from '@/components/player/LyricsUI';
import GuestGate from '@/components/auth/GuestGate';
import { TrackContextMenu } from '@/components/ui/TrackContextMenu';
import Image from 'next/image';
import Link from 'next/link';
import type { NowPlayingUIProps } from '@/components/player/NowPlayingUI';
import { DynamicGradientBackground } from '@/components/player/DynamicGradientBackground';

const css = `
  .np-range { position:absolute; inset:-6px 0; width:100%; height:calc(100% + 12px); opacity:0; cursor:pointer; z-index:10; }
  @keyframes spin { to { transform:rotate(360deg) } }
  .np-left-panel {
    flex: 4;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 10;
  }
  .np-left-inner {
    width: 100%;
    max-width: 460px;
  }
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

  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

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
          <DynamicGradientBackground coverUrl={coverUrl} trackId={currentTrack.id} />

          {/* ── Close ── */}
          <button onClick={onClose} style={{ position: 'absolute', top: 18, left: 18, zIndex: 20, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            <X size={14} strokeWidth={2.5} />
          </button>

          {/* ── MAIN LAYOUT — Apple Music style 2-col ── */}
          <div style={{
            position: 'relative', zIndex: 10, height: '100%',
            display: 'flex', alignItems: 'stretch',
            padding: '0 56px',
            gap: 96,
            maxWidth: 1400, margin: '0 auto',
          }}>

            {/* ══ LEFT: Album + Controls — fixed-width, vertically centered ══ */}
            <div className="np-left-panel">
              <div className="np-left-inner">
                {/* Album art */}
                <motion.div
                  layoutId={`artwork-${currentTrack.id}`}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  style={{
                    position: 'relative', aspectRatio: '1', width: '100%',
                    borderRadius: 12, overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)',
                    background: '#1a1a2a',
                  }}
                >
                  {coverUrl ? (
                    <Image src={coverUrl} alt={currentTrack.name} fill sizes="380px" style={{ objectFit: 'cover' }} priority />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(120,80,160,0.4), rgba(20,20,40,1))' }} />
                  )}
                  {isPreview && (
                    <span style={{ position: 'absolute', top: 10, right: 10, padding: '3px 10px', borderRadius: 999, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>Preview</span>
                  )}
                </motion.div>

                {/* Track info + actions */}
                <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                      {currentTrack.name}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    <button onClick={handleToggleLike} disabled={toggleLikeMutation.isPending} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: isLiked ? '#fa233b' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                      {toggleLikeMutation.isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2} />}
                    </button>
                    <div ref={props.moreMenuRef}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!props.isMoreMenuOpen) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPosition({ x: rect.right - 224, y: rect.bottom + 8 });
                            props.setIsMoreMenuOpen(true);
                          } else {
                            props.setIsMoreMenuOpen(false);
                          }
                        }} 
                        style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      >
                        <Ellipsis size={18} />
                      </button>
                      {props.isMoreMenuOpen && (
                        <TrackContextMenu
                          track={currentTrack}
                          isOpen={props.isMoreMenuOpen}
                          position={menuPosition}
                          onClose={() => props.setIsMoreMenuOpen(false)}
                          showPlayerControls={true}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                    <input type="range" aria-label="Seek time" className="np-range" min={0} max={duration || 0} value={currentTime} onChange={e => seek(Number(e.target.value))} />
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
                <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                  <button onClick={() => { }} style={{ background: 'none', border: 'none', color: '#e05050', cursor: 'pointer', display: 'flex' }}>
                    <Shuffle size={17} strokeWidth={2.5} />
                  </button>
                  <button onClick={prevTrack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <SkipBack size={24} fill="currentColor" strokeWidth={0} />
                  </button>
                  <button onClick={togglePlay} disabled={isResolving} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isResolving ? 0.5 : 1 }}>
                    {isResolving ? <Loader2 size={20} color="#111" style={{ animation: 'spin 1s linear infinite' }} /> : isPlaying ? <Pause size={20} fill="#111" color="#111" /> : <Play size={20} fill="#111" color="#111" style={{ marginLeft: 2 }} />}
                  </button>
                  <button onClick={nextTrack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <SkipForward size={24} fill="currentColor" strokeWidth={0} />
                  </button>
                  <button onClick={() => { }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', display: 'flex' }}>
                    <Repeat size={17} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Volume */}
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Volume2 size={14} color="rgba(255,255,255,0.5)" />
                  <div style={{ position: 'relative', flex: 1, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                    <input type="range" aria-label="Volume" className="np-range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} />
                    <div style={{ position: 'absolute', height: '100%', width: `${volume * 100}%`, background: '#fff', borderRadius: 2 }}>
                      <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ RIGHT: Lyrics — fills remaining space ══ */}
            <div style={{ flex: 6, display: 'flex', alignItems: 'center', overflow: 'hidden', height: '100%', minWidth: 0 }}>
              <LyricsUI
                currentTrack={currentTrack}
                lines={lines}
                activeIndex={activeIndex}
                isSynced={isSynced}
                isLoading={isLyricsLoading}
                scrollRef={lyricsScrollRef}
                onLineClick={(time, isPlaceholder) => { if (isSynced && !isPlaceholder) seek(time); }}
                hideHeader
                currentTime={currentTime}
                romanizations={props.romanizations}
                trackId={props.trackId ?? null}
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
