'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Play, Pause, SkipForward, SkipBack,
  Volume2, Volume1, Loader2, MessageSquare, ListMusic,
  Heart, Shuffle, Repeat, Repeat1,
} from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime } from '@/lib/utils';
import LyricsUI from '@/components/player/LyricsUI';
import GuestGate from '@/components/auth/GuestGate';
import Image from 'next/image';
import Link from 'next/link';
import type { NowPlayingUIProps } from '@/components/player/NowPlayingUI';
import { MoreMenu } from '@/components/player/NowPlayingUI';
import QueuePopup from '@/components/player/QueuePopup';

/* ─── Apple Music–style inline CSS ─── */
const css = `
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes am-marquee {
    0%, 18%  { transform: translateX(0); }
    50%      { transform: translateX(var(--marquee-dist)); }
    68%, 100%{ transform: translateX(0); }
  }

  /* Custom range thumb for progress */
  .am-progress-range {
    -webkit-appearance: none;
    appearance: none;
    position: absolute;
    inset: -8px 0;
    width: 100%;
    height: calc(100% + 16px);
    background: transparent;
    cursor: pointer;
    z-index: 10;
    margin: 0;
    padding: 0;
  }
  .am-progress-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 0;
    height: 0;
    opacity: 0;
    transition: width 0.15s, height 0.15s, opacity 0.15s;
  }
  .am-progress-range:active::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    opacity: 1;
  }
  .am-progress-range::-moz-range-thumb {
    width: 0;
    height: 0;
    opacity: 0;
    border: none;
    background: transparent;
    transition: width 0.15s, height 0.15s, opacity 0.15s;
  }
  .am-progress-range:active::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    opacity: 1;
  }

  /* Volume range */
  .am-vol-range {
    -webkit-appearance: none;
    appearance: none;
    position: absolute;
    inset: -6px 0;
    width: 100%;
    height: calc(100% + 12px);
    background: transparent;
    cursor: pointer;
    z-index: 10;
    margin: 0;
    padding: 0;
  }
  .am-vol-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .am-vol-range::-moz-range-thumb {
    width: 12px; height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    border: none;
  }

  /* Bottom action button hover */
  .am-action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.15s ease;
  }
  .am-action-btn:active {
    background: rgba(255,255,255,0.08);
  }
`;

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

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  if (!currentTrack) return null;
  const progress = duration ? (currentTime / duration) * 100 : 0;
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
          <style>{css}</style>

          {/* ── BG: blurred artwork ── */}
          <div style={{ position: 'absolute', inset: '-20px', zIndex: 0 }}>
            {coverUrl && (
              <Image
                src={coverUrl}
                alt="bg"
                fill
                style={{ objectFit: 'cover', transform: 'scale(1.15)' }}
                priority
              />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              backdropFilter: 'blur(80px) saturate(180%)',
              WebkitBackdropFilter: 'blur(80px) saturate(180%)',
              background: 'rgba(0,0,0,0.35)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)',
            }} />
          </div>

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
              <>
                {/* Mini header: artwork + info */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginBottom: 16, paddingBottom: 16,
                  borderBottom: '0.5px solid rgba(255,255,255,0.1)',
                }}>
                  <div style={{
                    position: 'relative', width: 44, height: 44,
                    borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                    background: '#1a1a2a',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}>
                    {coverUrl && <Image src={coverUrl} alt={currentTrack.name} fill sizes="300px" style={{ objectFit: 'cover' }} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 600, color: '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      letterSpacing: '-0.2px',
                    }}>
                      {currentTrack.name}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      marginTop: 1,
                    }}>
                      {artistNames}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={handleToggleLike}
                      disabled={toggleLikeMutation.isPending}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                        color: isLiked ? '#FA243C' : 'rgba(255,255,255,0.5)',
                        display: 'flex',
                      }}
                    >
                      {toggleLikeMutation.isPending
                        ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                      }
                    </button>
                    <MoreMenu {...props} openMenuUpward={true} />
                  </div>
                </div>

                {/* Lyrics container */}
                <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                  <LyricsUI
                    currentTrack={currentTrack}
                    lines={lines}
                    activeIndex={activeIndex}
                    isSynced={isSynced}
                    isLoading={isLyricsLoading}
                    scrollRef={mobileLyricsScrollRef}
                    onLineClick={(time, isPlaceholder) => {
                      if (isSynced && !isPlaceholder) seek(time);
                    }}
                    hideHeader
                  />
                </div>
              </>
            ) : (
              /* ─────────────── ARTWORK MODE ─────────────── */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

                {/* ── Artwork ── */}
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  <motion.div
                    animate={{
                      scale: isPlaying ? 1 : 0.88,
                      borderRadius: isPlaying ? 12 : 12,
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.8 }}
                    style={{
                      position: 'relative', width: '100%', maxWidth: 360,
                      aspectRatio: '1', borderRadius: 12,
                      overflow: 'hidden', background: '#1a1a2a',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    {coverUrl && (
                      <Image
                        src={coverUrl}
                        alt={currentTrack.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        priority
                      />
                    )}
                    {isPreview && (
                      <span style={{
                        position: 'absolute', top: 12, right: 12,
                        padding: '4px 12px', borderRadius: 999,
                        fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.8px', fontWeight: 700,
                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}>
                        Preview
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* ── Track info + Like ── */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 12,
                  marginTop: 24, marginBottom: 20,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <motion.div
                      key={currentTrack.id + '-title'}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{
                        fontSize: 21, fontWeight: 700, color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        letterSpacing: '-0.4px', lineHeight: 1.25,
                      }}
                    >
                      {currentTrack.name}
                    </motion.div>
                    <motion.div
                      key={currentTrack.id + '-artist'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
                      style={{
                        marginTop: 3, fontSize: 17, fontWeight: 500,
                        color: 'rgba(255,255,255,0.55)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {currentTrack.artists.primary.map((a: any, i: number) => (
                        <span key={a.id}>
                          <Link
                            href={`/artist/${a.id}`}
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            style={{ color: 'inherit', textDecoration: 'none' }}
                          >
                            {a.name}
                          </Link>
                          {i < currentTrack.artists.primary.length - 1 && ', '}
                        </span>
                      ))}
                    </motion.div>
                  </div>

                  {/* Like + More */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, paddingTop: 2 }}>
                    <button
                      onClick={handleToggleLike}
                      disabled={toggleLikeMutation.isPending}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, display: 'flex',
                        color: isLiked ? '#FA243C' : 'rgba(255,255,255,0.5)',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {toggleLikeMutation.isPending
                        ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 1.8} />
                      }
                    </button>
                    <MoreMenu {...props} openMenuUpward={true} />
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════
                COMMON BOTTOM CONTROLS
            ═══════════════════════════════════════════ */}
            <div style={{ flexShrink: 0 }}>

              {/* ── Progress Bar ── */}
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  position: 'relative', height: 4,
                  background: 'rgba(255,255,255,0.18)', borderRadius: 2,
                }}>
                  <input
                    type="range"
                    className="am-progress-range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={e => seek(Number(e.target.value))}
                    onPointerDown={() => setIsDraggingProgress(true)}
                    onPointerUp={() => setIsDraggingProgress(false)}
                  />
                  <motion.div
                    style={{
                      position: 'absolute', height: '100%',
                      background: 'rgba(255,255,255,0.92)', borderRadius: 2,
                      width: `${progress}%`,
                    }}
                    transition={{ duration: isDraggingProgress ? 0 : 0.1 }}
                  >
                    {/* Knob that appears on active drag */}
                    <div style={{
                      position: 'absolute', right: -4, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 8, height: 8,
                      background: '#fff', borderRadius: '50%',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                      transition: 'transform 0.15s ease',
                    }} />
                  </motion.div>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginTop: 8,
                  fontSize: 11, fontWeight: 500,
                  color: 'rgba(255,255,255,0.45)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.2px',
                }}>
                  <span>{formatTime(currentTime)}</span>
                  <span>-{formatTime(Math.max((duration || 0) - currentTime, 0))}</span>
                </div>
              </div>

              {/* ── Playback Controls ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 12px', marginBottom: 28, marginTop: 4,
              }}>
                {/* Skip Back */}
                <button
                  onClick={prevTrack}
                  style={{
                    background: 'none', border: 'none', color: '#fff',
                    cursor: 'pointer', display: 'flex', padding: 8,
                  }}
                >
                  <SkipBack size={34} fill="currentColor" strokeWidth={0} />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  disabled={isResolving}
                  style={{
                    background: 'none', border: 'none', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                    opacity: isResolving ? 0.5 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {isResolving ? (
                    <Loader2 size={52} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : isPlaying ? (
                    <Pause size={52} fill="currentColor" strokeWidth={0} />
                  ) : (
                    <Play size={52} fill="currentColor" strokeWidth={0} style={{ marginLeft: 4 }} />
                  )}
                </button>

                {/* Skip Forward */}
                <button
                  onClick={nextTrack}
                  style={{
                    background: 'none', border: 'none', color: '#fff',
                    cursor: 'pointer', display: 'flex', padding: 8,
                  }}
                >
                  <SkipForward size={34} fill="currentColor" strokeWidth={0} />
                </button>
              </div>

              {/* ── Volume ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 24, padding: '0 2px',
              }}>
                <Volume1 size={16} color="rgba(255,255,255,0.4)" />
                <div style={{
                  position: 'relative', flex: 1, height: 4,
                  background: 'rgba(255,255,255,0.15)', borderRadius: 2,
                }}>
                  <input
                    type="range"
                    className="am-vol-range"
                    min={0} max={1} step={0.01}
                    value={volume}
                    onChange={e => setVolume(Number(e.target.value))}
                  />
                  <div style={{
                    position: 'absolute', height: '100%',
                    width: `${volume * 100}%`,
                    background: 'rgba(255,255,255,0.85)', borderRadius: 2,
                    transition: 'width 0.05s linear',
                  }} />
                </div>
                <Volume2 size={20} color="rgba(255,255,255,0.4)" />
              </div>

              {/* ── Bottom Actions: Lyrics | Queue ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 48px', position: 'relative',
              }}>
                {/* Lyrics Toggle */}
                <button
                  onClick={() => setIsLyricsOpen(!isLyricsOpen)}
                  className="am-action-btn"
                  disabled={lines.length === 0}
                  style={{
                    color: isLyricsOpen ? '#fff' : 'rgba(255,255,255,0.45)',
                    opacity: lines.length > 0 ? 1 : 0.3,
                    position: 'relative',
                  }}
                >
                  <MessageSquare
                    size={22}
                    fill={isLyricsOpen ? 'currentColor' : 'none'}
                    strokeWidth={isLyricsOpen ? 0 : 1.8}
                  />
                  {isLyricsOpen && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: 2,
                      background: '#fff',
                    }} />
                  )}
                </button>

                {/* Queue Toggle */}
                <button
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                  className="am-action-btn"
                  style={{
                    color: isQueueOpen ? '#fff' : 'rgba(255,255,255,0.45)',
                    position: 'relative',
                  }}
                >
                  <ListMusic size={22} strokeWidth={1.8} />
                  {isQueueOpen && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: 2,
                      background: '#fff',
                    }} />
                  )}
                </button>

                {/* Queue Popup */}
                {isQueueOpen && (
                  <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.5)',
                  }}>
                    <QueuePopup isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
                  </div>
                )}
              </div>
            </div>

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
