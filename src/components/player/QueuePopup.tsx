'use client';

import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime } from '@/lib/utils';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface QueuePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueuePopup({ isOpen, onClose }: QueuePopupProps) {
  const { queue, queueIndex, playTrack } = usePlayer();
  const popupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const upNext = queue.slice(queueIndex + 1);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popupRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '340px',
            height: '100vh',
            background: 'rgba(28, 28, 30, 0.97)',
            borderLeft: '0.5px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          }}
        >
          <style>{`
        .queue-track-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 7px 10px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .queue-track-row:hover {
          background: rgba(255,255,255,0.08);
        }
        .queue-track-row:hover .queue-duration {
          color: rgba(255,255,255,0.6);
        }
        .queue-list::-webkit-scrollbar { width: 4px; }
        .queue-list::-webkit-scrollbar-track { background: transparent; }
        .queue-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
        }
      `}</style>

          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px 14px',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: '17px',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.3px',
            }}>
              Up next
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => { /* TODO: clear queue */ }}
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ff3b30',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                Clear
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
                aria-label="Loop"
              >
                {/* Repeat / Infinity icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 2l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 22l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Track list */}
          <div
            className="queue-list"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '6px 8px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.15) transparent',
            }}
          >
            {upNext.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '160px',
              }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                  No upcoming tracks
                </p>
              </div>
            ) : (
              upNext.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  className="queue-track-row"
                  onClick={() => playTrack(track, queue)}
                >
                  {/* Album art */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '5px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.06)',
                    position: 'relative',
                  }}>
                    {getBestImageUrl(track.image) ? (
                      <Image
                        src={getBestImageUrl(track.image)!}
                        alt={track.name}
                        fill
                        sizes="42px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.08)' }} />
                    )}
                  </div>

                  {/* Track info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      letterSpacing: '-0.1px',
                      lineHeight: 1.3,
                      margin: 0,
                    }}>
                      {track.name}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.45)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                      margin: '2px 0 0',
                    }}>
                      {track.artists.primary.map((a: { name: string }) => a.name).join(', ')}
                    </p>
                  </div>

                  {/* Duration */}
                  <div
                    className="queue-duration"
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.35)',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 500,
                      flexShrink: 0,
                      transition: 'color 0.12s ease',
                    }}
                  >
                    {formatTime(track.duration)}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}