'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Play, Pause, SkipForward, SkipBack, Volume2, Volume1, MessageSquare, ListMusic, Shuffle, Repeat } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import QueuePopup from '@/components/player/QueuePopup';
import { usePlayer } from '@/context/PlayerContext';

interface MobilePlayerControlsProps {
  duration: number | undefined;
  currentTime: number;
  seek: (time: number) => void;
  prevTrack: () => void;
  nextTrack: () => void;
  togglePlay: () => void;
  isResolving: boolean;
  isPlaying: boolean;
  volume: number;
  setVolume: (v: number) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  linesLength: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}

export function MobilePlayerControls({
  duration, currentTime, seek, prevTrack, nextTrack, togglePlay,
  isResolving, isPlaying, volume, setVolume, isLyricsOpen, setIsLyricsOpen, linesLength,
  isShuffled, repeatMode, toggleShuffle, cycleRepeatMode
}: MobilePlayerControlsProps) {
  const { isAutoplayEnabled, toggleAutoplay } = usePlayer();
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
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
        padding: '0 8px', marginBottom: 28, marginTop: 4,
      }}>
        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          style={{
            background: 'none', border: 'none', 
            color: isShuffled ? '#FA243C' : 'rgba(255,255,255,0.45)',
            cursor: 'pointer', display: 'flex', padding: 8,
          }}
        >
          <Shuffle size={24} strokeWidth={2.5} />
        </button>

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

        {/* Repeat */}
        <button
          onClick={cycleRepeatMode}
          style={{
            background: 'none', border: 'none',
            color: repeatMode !== 'none' ? '#FA243C' : 'rgba(255,255,255,0.45)',
            cursor: 'pointer', display: 'flex', padding: 8,
            position: 'relative'
          }}
        >
          <Repeat size={24} strokeWidth={2.5} />
          {repeatMode === 'one' && (
            <div style={{
              position: 'absolute', top: 5, right: 2,
              fontSize: 10, fontWeight: 800, color: '#FA243C',
              background: '#1a1a2a', borderRadius: '50%',
              width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              1
            </div>
          )}
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
          disabled={linesLength === 0}
          style={{
            color: isLyricsOpen ? '#fff' : 'rgba(255,255,255,0.45)',
            opacity: linesLength > 0 ? 1 : 0.3,
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
          <div 
            onClick={() => setIsQueueOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.5)',
            }}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <QueuePopup isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
