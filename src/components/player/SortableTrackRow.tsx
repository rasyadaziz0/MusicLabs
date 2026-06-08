'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime } from '@/lib/utils';
import Image from 'next/image';
import { SortableTrack } from './QueuePopupController';

interface SortableTrackRowProps {
  track: SortableTrack;
  onClick: () => void;
}

export function SortableTrackRow({ track, onClick }: SortableTrackRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.uniqueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="queue-track-row"
      onClick={onClick}
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
          {track.artists?.primary?.map((a: { name: string }) => a.name).join(', ')}
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

      {/* Drag handle icon */}
      <div
        className="queue-drag-handle"
        {...attributes}
        {...listeners}
        style={{
          color: 'rgba(255,255,255,0.3)',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          padding: '4px',
          marginLeft: '4px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="9" x2="20" y2="9"></line>
          <line x1="4" y1="15" x2="20" y2="15"></line>
        </svg>
      </div>
    </div>
  );
}
