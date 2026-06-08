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

  get sortableItems(): SortableTrack[] {
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
      const items = this.sortableItems;
      const oldIndex = items.findIndex((t) => t.uniqueId === active.id);
      const newIndex = items.findIndex((t) => t.uniqueId === over.id);

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
}
