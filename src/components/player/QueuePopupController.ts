import { DragEndEvent } from '@dnd-kit/core';
import { Song } from '@/types/music';

export interface QueueContextAdapter {
  queue: Song[];
  queueIndex: number;
  repeatMode: 'none' | 'one' | 'all';
  playTrack: (track: Song, queue?: Song[]) => void;
  clearQueue: () => void;
  cycleRepeatMode: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  removeFromQueue: (trackId: string) => void;
  promoteToManual: (trackId: string) => void;
}

export type SortableTrack = Song & { uniqueId: string };

export class QueuePopupController {
  private player: QueueContextAdapter;

  constructor(player: QueueContextAdapter) {
    this.player = player;
  }

  get upNext(): Song[] {
    return this.player.queue.slice(this.player.queueIndex + 1);
  }

  get manualItems(): SortableTrack[] {
    return this.upNext.filter(t => !t.isAutoplay).map((track, i) => ({ ...track, uniqueId: `${track.id}-${i}-m` }));
  }

  get autoplayItems(): SortableTrack[] {
    return this.upNext.filter(t => t.isAutoplay).map((track, i) => ({ ...track, uniqueId: `${track.id}-${i}-a` }));
  }

  get sortableItems(): SortableTrack[] {
    // Keep this for backward compatibility if needed, though UI will use manualItems and autoplayItems
    return this.upNext.map((track, i) => ({ ...track, uniqueId: `${track.id}-${i}` }));
  }

  get repeatMode(): 'none' | 'one' | 'all' {
    return this.player.repeatMode;
  }

  get hasUpcomingTracks(): boolean {
    return this.sortableItems.length > 0;
  }

  handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      // Find within the combined sortable items list to map back to queue index
      const combined = [...this.manualItems, ...this.autoplayItems];
      const oldIndex = combined.findIndex((t) => t.uniqueId === active.id);
      const newIndex = combined.findIndex((t) => t.uniqueId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        this.player.reorderQueue(
          this.player.queueIndex + 1 + oldIndex, 
          this.player.queueIndex + 1 + newIndex
        );
      }
    }
  };

  playTrack = (track: Song) => {
    this.player.playTrack(track, this.player.queue);
  };

  clearQueue = () => {
    this.player.clearQueue();
  };

  cycleRepeatMode = () => {
    this.player.cycleRepeatMode();
  };

  removeFromQueue = (trackId: string) => {
    this.player.removeFromQueue(trackId);
  };

  promoteToManual = (trackId: string) => {
    this.player.promoteToManual(trackId);
  };
}
