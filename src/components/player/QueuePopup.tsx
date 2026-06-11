'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LiquidGlassCard } from '@/components/ui/LiquidGlass';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { QueuePopupController } from './QueuePopupController';
import { SortableTrackRow } from './SortableTrackRow';
import { AutoplayTrackRow } from './AutoplayTrackRow';
import { Infinity } from 'lucide-react';

interface QueuePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QueuePopup({ isOpen, onClose }: QueuePopupProps) {
  const player = usePlayer();
  // Instantiate the controller pattern (OOP approach) to handle the complex queue mapping and DnD logic
  const controller = useMemo(() => new QueuePopupController(player), [player]);

  const popupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popupRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full md:w-[340px]"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          }}
        >
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-black/45" />

          <LiquidGlassCard
            glowIntensity="none"
            shadowIntensity="none"
            blurIntensity="xl"
            borderRadius="0px"
            className="absolute inset-0 w-full h-full flex flex-col"
            draggable={false}
          >
            <div className="relative z-30 flex flex-col h-full w-full">
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
        .queue-track-row:hover .queue-drag-handle {
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  className="md:hidden"
                  onClick={onClose}
                  style={{
                    background: 'none', border: 'none', padding: 0, color: '#fff',
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
                <span style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '-0.3px',
                }}>
                  Up next
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={controller.clearQueue}
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
                  onClick={controller.cycleRepeatMode}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: controller.repeatMode !== 'none' ? '#fff' : 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    position: 'relative',
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
                  {controller.repeatMode === 'one' && (
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#fff',
                    }}>
                      1
                    </span>
                  )}
                </button>

                <button
                  onClick={player.toggleAutoplay}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: player.isAutoplayEnabled ? '#fff' : 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  aria-label="Autoplay"
                >
                  <Infinity size={20} strokeWidth={2.5} />
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
              {!controller.hasUpcomingTracks ? (
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
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={controller.handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                  >
                    <SortableContext
                      items={controller.manualItems.map(t => t.uniqueId)}
                      strategy={verticalListSortingStrategy}
                    >
                      {controller.manualItems.length > 0 && (
                        <div style={{ padding: '8px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Playing Next
                        </div>
                      )}
                      {controller.manualItems.map((track) => (
                        <SortableTrackRow
                          key={track.uniqueId}
                          track={track}
                          onClick={() => controller.playTrack(track)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  {controller.autoplayItems.length > 0 && (
                    <>
                      <div style={{
                        padding: '16px 8px 8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>Autoplay</span>
                        <Infinity size={14} strokeWidth={2.5} />
                      </div>
                      {controller.autoplayItems.map((track) => (
                        <AutoplayTrackRow
                          key={track.uniqueId}
                          track={track}
                          onClick={() => controller.playTrack(track)}
                          onPromote={controller.promoteToManual}
                          onRemove={controller.removeFromQueue}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
            </div>
          </LiquidGlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}