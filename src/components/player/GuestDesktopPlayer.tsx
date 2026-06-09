'use client';

import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, Loader2, Star, X } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MoreMenu } from '@/components/player/NowPlayingUI';

// We reuse the NowPlayingUIProps type but we can omit what we don't need or just pass it
export function GuestDesktopPlayer({
  props,
  coverUrl,
  progress,
}: {
  props: any;
  coverUrl: string;
  progress: number;
}) {
  const {
    onClose, currentTrack, isPlaying, isResolving, isPreview,
    currentTime, duration, volume, togglePlay, nextTrack, prevTrack,
    seek, setVolume, handleToggleLike, isLiked, toggleLikeMutation,
    isRadio, radioMeta
  } = props;

  return (
    <>
      {/* ── Close ── */}
      <button onClick={onClose} style={{ position: 'absolute', top: 18, left: 18, zIndex: 20, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
        <X size={14} strokeWidth={2.5} />
      </button>

      {/* ── MAIN LAYOUT (Centered single pane for guests) ── */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', margin: '0 auto' }}>
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column' }}>
          {/* Album art */}
          <motion.div 
            layoutId={`artwork-${currentTrack.id}`}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'relative', aspectRatio: '1', width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 72px rgba(0,0,0,0.6), 0 12px 32px rgba(0,0,0,0.4)', background: '#1a1a2a' }}
          >
            {coverUrl ? (
              <Image src={coverUrl} alt={currentTrack.name} fill sizes="64px" style={{ objectFit: 'cover' }} priority />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(120,80,160,0.4), rgba(20,20,40,1))' }} />
            )}
            {isPreview && (
              <span style={{ position: 'absolute', top: 12, right: 12, padding: '4px 12px', borderRadius: 999, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>Preview</span>
            )}
          </motion.div>

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
                    {currentTrack.artists.primary.map((a: any, i: number) => (
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
              <button onClick={handleToggleLike} disabled={toggleLikeMutation?.isPending} style={{ background: 'none', border: 'none', color: isLiked ? '#e0a030' : 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                {toggleLikeMutation?.isPending ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Star size={20} fill={isLiked ? 'currentColor' : 'none'} />}
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
  );
}
