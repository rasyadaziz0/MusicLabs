'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getPortalRoot } from '@/lib/utils/portalRoot';
import { AnimatePresence, motion } from 'framer-motion';
import { GlassBar } from '@/components/ui/LiquidGlass';
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
import { QueuePopupProps } from '@/types/components/player/QueuePopupProps';
import './QueuePopup.css';

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
          className="w-full md:w-[340px] md:max-xl:w-[260px] md:portrait:w-[212px] queue-popup-overlay"
        >
          <GlassBar
            className="absolute inset-0 w-full h-full queue-glass-bar border-none"
          >
            <div className="flex flex-col h-full w-full relative">
            <div className="relative z-30 flex flex-col h-full w-full">

              {/* Header */}
              <div className="queue-header">
                <div className="queue-header-left">
                  <button
                    className="md:hidden queue-btn-close-mobile"
                    onClick={onClose}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                  <span className="queue-header-title">
                    Up next
                  </span>
                </div>
                <div className="queue-header-right">
                  <button
                    onClick={controller.clearQueue}
                    className="queue-btn-clear"
                  >
                    Clear
                  </button>
                  <button
                    onClick={controller.cycleRepeatMode}
                    className={`queue-btn-action ${controller.repeatMode !== 'none' ? 'active' : 'inactive'}`}
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
                      <span className="queue-badge-repeat-one">
                        1
                      </span>
                    )}
                  </button>

                  <button
                    onClick={player.toggleAutoplay}
                    className={`queue-btn-action ${player.isAutoplayEnabled ? 'active' : 'inactive'}`}
                    aria-label="Autoplay"
                  >
                    <Infinity size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Track list */}
              <div className="queue-list">
                {!controller.hasUpcomingTracks ? (
                  <div className="queue-empty-state">
                    <p className="queue-empty-text">
                      No upcoming tracks
                    </p>
                  </div>
                ) : (
                  <>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => {
                        const { active, over } = e;
                        if (active && over) {
                          controller.reorder(active.id.toString(), over.id.toString());
                        }
                      }}
                      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                    >
                      <SortableContext
                        items={controller.manualItems.map(t => t.uniqueId)}
                        strategy={verticalListSortingStrategy}
                      >
                        {controller.manualItems.length > 0 && (
                          <div className="queue-section-title">
                            Playing Next
                          </div>
                        )}
                        {controller.manualItems.map((track) => (
                          <SortableTrackRow
                            key={track.uniqueId}
                            track={track}
                            onClick={() => controller.playTrack(track, track.queueItemId)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {controller.autoplayItems.length > 0 && (
                      <>
                        <div className="queue-section-title-autoplay queue-section-title">
                          <span>Autoplay</span>
                          <Infinity size={14} strokeWidth={2.5} />
                        </div>
                        {controller.autoplayItems.map((track) => (
                          <AutoplayTrackRow
                            key={track.uniqueId}
                            track={track}
                            onClick={() => controller.playTrack(track, track.queueItemId)}
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
            </div>
          </GlassBar>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, getPortalRoot());
}