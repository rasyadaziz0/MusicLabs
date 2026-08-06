'use client';

import { ImageHelper } from '@/lib/utils/ImageHelper';
import { TimeHelper } from '@/lib/utils/TimeHelper';
import Image from 'next/image';
import { SortableTrack } from '@/types/player/controller';
import { Plus, X } from 'lucide-react';
import { AutoplayTrackRowProps } from '@/types/components/player/AutoplayTrackRowProps';
export function AutoplayTrackRow({ track, onClick, onPromote, onRemove }: AutoplayTrackRowProps) {
  return (
    <div
      className="queue-track-row group"
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
        {ImageHelper.getBestImageUrl(track.image) ? (
          <Image
            src={ImageHelper.getBestImageUrl(track.image)!}
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

      {/* Actions (visible on hover) and Duration */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onPromote(track.id); }}
            className="p-1.5 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="Move to Playing Next"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(track.id); }}
            className="p-1.5 text-white/40 hover:text-[#FA243C] transition-colors rounded-full hover:bg-[#FA243C]/10"
            title="Remove from Autoplay"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div
          className="queue-duration group-hover:hidden"
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
            transition: 'color 0.12s ease',
          }}
        >
          {TimeHelper.formatTime(track.duration)}
        </div>
      </div>
    </div>
  );
}
