'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Volume2, Volume, Loader2, Star, ChevronDown, ListMusic, MessageSquare
} from 'lucide-react';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime } from '@/lib/utils';
import GuestGate from '@/components/auth/GuestGate';
import Image from 'next/image';
import Link from 'next/link';
import type { NowPlayingUIProps } from '@/components/player/NowPlayingUI';
import { MoreMenu } from '@/components/player/NowPlayingUI';

const css = `
  .np-range { position:absolute; inset:-6px 0; width:100%; height:calc(100% + 12px); opacity:0; cursor:pointer; z-index:10; }
  @keyframes spin { to { transform:rotate(360deg) } }
`;

export function GuestNowPlayingUI(props: NowPlayingUIProps) {
  const {
    isOpen, onClose, currentTrack, isPlaying, isResolving, isPreview,
    currentTime, duration, volume, togglePlay, nextTrack, prevTrack,
    seek, setVolume, handleToggleLike, isLiked, toggleLikeMutation,
    isGuestGateOpen, guestGateAction, setIsGuestGateOpen,
    isRadio, radioMeta, isMobile,
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
            {coverUrl && <Image src={coverUrl} alt="bg" fill style={{ objectFit: 'cover', transform: 'scale(1.15)' }} />}
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(80px) saturate(180%)', WebkitBackdropFilter: 'blur(80px) saturate(180%)', background: 'rgba(0,0,0,0.35)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }} />
          </div>

          {/* ── DESKTOP VIEW ── */}
          {!isMobile && (
            <>
              {/* ── Close ── */}
              <button onClick={onClose} style={{ position: 'absolute', top: 18, left: 18, zIndex: 20, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                <X size={14} strokeWidth={2.5} />
              </button>

              {/* ── MAIN LAYOUT (Centered single pane for guests) ── */}
              <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', margin: '0 auto' }}>
                <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column' }}>
                  {/* Album art */}
                  <div style={{ position: 'relative', aspectRatio: '1', width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 72px rgba(0,0,0,0.6), 0 12px 32px rgba(0,0,0,0.4)', background: '#1a1a2a' }}>
                    {coverUrl ? (
                      <Image src={coverUrl} alt={currentTrack.name} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(120,80,160,0.4), rgba(20,20,40,1))' }} />
                    )}
                    {isPreview && (
                      <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 999, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>Preview</span>
                    )}
                  </div>

                  {/* Track info + actions */}
                  <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px' }}>
                        {isRadio && radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
                          ? radioMeta.title
                          : currentTrack.name}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {isRadio ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ position: 'relative', display: 'flex', height: '6px', width: '6px', flexShrink: 0 }}><span style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '9999px', backgroundColor: '#FA243C', opacity: 0.75 }} /><span style={{ position: 'relative', display: 'inline-flex', borderRadius: '9999px', height: '6px', width: '6px', backgroundColor: '#FA243C' }} /></span>
                            {radioMeta?.station || currentTrack.name} • Live
                          </span>
                        ) : (
                          <>
                            {currentTrack.artists.primary.map((a, i) => (
                              <span key={a.id}>
                                <Link href={`/artist/${a.id}`} onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>{a.name}</Link>
                                {i < currentTrack.artists.primary.length - 1 && ' — '}
                              </span>
                            ))}
                            {currentTrack.album?.name && ` — ${currentTrack.album.name}`}
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4, flexShrink: 0 }}>
                      <button onClick={handleToggleLike} disabled={toggleLikeMutation.isPending} style={{ background: 'none', border: 'none', color: isLiked ? '#e0a030' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        {toggleLikeMutation.isPending ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Star size={20} fill={isLiked ? 'currentColor' : 'none'} />}
                      </button>
                      <MoreMenu {...props} />
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!isRadio ? (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                        <input type="range" className="np-range" min={0} max={duration || 0} value={currentTime} onChange={e => seek(Number(e.target.value))} />
                        <div style={{ position: 'absolute', height: '100%', width: `${progress}%`, background: '#fff', borderRadius: 2 }}>
                          <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
                        <span>{formatTime(currentTime)}</span>
                        <span>-{formatTime(Math.max((duration || 0) - currentTime, 0))}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ position: 'relative', height: 4, background: '#FA243C33', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '33%', background: '#FA243C66', borderRadius: 2, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                      </div>
                    </div>
                  )}

                  {/* Playback controls */}
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
                    {!isRadio ? (
                      <button onClick={() => { }} style={{ background: 'none', border: 'none', color: '#e05050', cursor: 'pointer', display: 'flex' }}>
                        <Shuffle size={20} strokeWidth={2.5} />
                      </button>
                    ) : <div style={{ width: 20 }} />}
                    
                    {!isRadio ? (
                      <button onClick={prevTrack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                        <SkipBack size={32} fill="currentColor" strokeWidth={0} />
                      </button>
                    ) : <div style={{ width: 32 }} />}

                    <button onClick={togglePlay} disabled={isResolving} style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: isResolving ? 0.5 : 1 }}>
                      {isResolving ? <Loader2 size={24} color="#111" style={{ animation: 'spin 1s linear infinite' }} /> : isPlaying ? <Pause size={24} fill="#111" color="#111" /> : <Play size={24} fill="#111" color="#111" style={{ marginLeft: 2 }} />}
                    </button>

                    {!isRadio ? (
                      <button onClick={nextTrack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                        <SkipForward size={32} fill="currentColor" strokeWidth={0} />
                      </button>
                    ) : <div style={{ width: 32 }} />}

                    {!isRadio ? (
                      <button onClick={() => { }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', display: 'flex' }}>
                        <Repeat size={20} strokeWidth={2.5} />
                      </button>
                    ) : <div style={{ width: 20 }} />}
                  </div>

                  {/* Volume */}
                  <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Volume2 size={16} color="rgba(255,255,255,0.5)" />
                    <div style={{ position: 'relative', flex: 1, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                      <input type="range" className="np-range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} />
                      <div style={{ position: 'absolute', height: '100%', width: `${volume * 100}%`, background: '#fff', borderRadius: 2 }} />
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* ── MOBILE VIEW ── */}
          {isMobile && (
            <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: 'env(safe-area-inset-top, 12px) 28px env(safe-area-inset-bottom, 24px)', paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}>

              {/* Pill drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 20 }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.35)' }} />
                </button>
              </div>

              {/* Artwork */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                <motion.div
                  animate={{ scale: isPlaying ? 1 : 0.88 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.8 }}
                  style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#1a1a2a', boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)' }}
                >
                  {coverUrl ? <Image src={coverUrl} alt={currentTrack.name} fill style={{ objectFit: 'cover' }} priority /> : null}
                  {isPreview && (
                    <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 999, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>Preview</span>
                  )}
                </motion.div>
              </div>

              {/* Track info + actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 24, marginBottom: 20 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 21, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.4px', lineHeight: 1.25 }}>
                    {isRadio && radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
                      ? radioMeta.title : currentTrack.name}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
                    {isRadio ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ position: 'relative', display: 'flex', height: '6px', width: '6px', flexShrink: 0 }}><span style={{ animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '9999px', backgroundColor: '#FA243C', opacity: 0.75 }} /><span style={{ position: 'relative', display: 'inline-flex', borderRadius: '9999px', height: '6px', width: '6px', backgroundColor: '#FA243C' }} /></span>
                        {radioMeta?.station || currentTrack.name} • Live
                      </span>
                    ) : (
                      <>
                        {currentTrack.artists.primary.map((a: any, i: number) => (
                          <span key={a.id}>
                            <Link href={`/artist/${a.id}`} onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ color: 'inherit', textDecoration: 'none' }}>{a.name}</Link>
                            {i < currentTrack.artists.primary.length - 1 && ', '}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 2, flexShrink: 0 }}>
                  <button onClick={handleToggleLike} disabled={toggleLikeMutation.isPending} style={{ background: 'none', border: 'none', color: isLiked ? '#FA243C' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4, display: 'flex' }}>
                    {toggleLikeMutation.isPending ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <Star size={24} fill={isLiked ? 'currentColor' : 'none'} />}
                  </button>
                  <MoreMenu {...props} openMenuUpward={true} />
                </div>
              </div>

              {/* Bottom controls */}
              <div style={{ flexShrink: 0 }}>
                {/* Progress bar */}
                {!isRadio ? (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 2 }}>
                      <input type="range" className="np-range" min={0} max={duration || 0} value={currentTime} onChange={e => seek(Number(e.target.value))} />
                      <div style={{ position: 'absolute', height: '100%', width: `${progress}%`, background: 'rgba(255,255,255,0.92)', borderRadius: 2 }}>
                        <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.2px' }}>
                      <span>{formatTime(currentTime)}</span>
                      <span>-{formatTime(Math.max((duration || 0) - currentTime, 0))}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ position: 'relative', height: 4, background: '#FA243C33', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '33%', background: '#FA243C66', borderRadius: 2, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    </div>
                  </div>
                )}

                {/* Playback controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', marginBottom: 28, marginTop: 4 }}>
                  {!isRadio ? (
                    <button onClick={prevTrack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 8 }}>
                      <SkipBack size={34} fill="currentColor" strokeWidth={0} />
                    </button>
                  ) : <div style={{ width: 50 }} />}
                  <button onClick={togglePlay} disabled={isResolving} style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, opacity: isResolving ? 0.5 : 1 }}>
                    {isResolving ? <Loader2 size={52} className="animate-spin" /> : isPlaying ? <Pause size={52} fill="currentColor" strokeWidth={0} /> : <Play size={52} fill="currentColor" strokeWidth={0} style={{ marginLeft: 4 }} />}
                  </button>
                  {!isRadio ? (
                    <button onClick={nextTrack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', padding: 8 }}>
                      <SkipForward size={34} fill="currentColor" strokeWidth={0} />
                    </button>
                  ) : <div style={{ width: 50 }} />}
                </div>

                {/* Volume */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 2px' }}>
                  <Volume size={16} color="rgba(255,255,255,0.4)" />
                  <div style={{ position: 'relative', flex: 1, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}>
                    <input type="range" className="np-range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} />
                    <div style={{ position: 'absolute', height: '100%', width: `${volume * 100}%`, background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
                  </div>
                  <Volume2 size={20} color="rgba(255,255,255,0.4)" />
                </div>

                {/* Bottom action icons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px' }}>
                  <button onClick={() => setIsGuestGateOpen(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: 10, display: 'flex', borderRadius: '50%' }}>
                    <MessageSquare size={22} strokeWidth={1.8} />
                  </button>
                  <button onClick={() => setIsGuestGateOpen(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: 10, display: 'flex', borderRadius: '50%' }}>
                    <ListMusic size={22} strokeWidth={1.8} />
                  </button>
                </div>
              </div>

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
