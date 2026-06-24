import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueManager } from './QueueManager';
import { Song } from '@/types/music';

// Mock Song
const createSong = (id: string, isAutoplay: boolean = false): Song => ({
  id,
  name: `Song ${id}`,
  type: 'song',
  year: '2024',
  releaseDate: null,
  duration: 200,
  label: '',
  explicitContent: false,
  playCount: 0,
  language: '',
  hasLyrics: false,
  lyricsId: null,
  url: '',
  copyright: '',
  album: { id: 'a1', name: 'Album', url: '' },
  artists: { primary: [], featured: [], all: [] },
  image: [],
  downloadUrl: [],
  isAutoplay
});

describe('QueueManager', () => {
  let manager: QueueManager;
  let onStateChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onStateChange = vi.fn();
    manager = new QueueManager({ onStateChange: onStateChange as any });
  });

  it('should initialize with empty state', () => {
    expect(manager.queue).toHaveLength(0);
    expect(manager.queueIndex).toBe(-1);
    expect(manager.isShuffled).toBe(false);
    expect(manager.repeatMode).toBe('none');
  });

  describe('setQueue', () => {
    it('should set the queue and emit state', () => {
      const tracks = [createSong('1'), createSong('2')];
      manager.setQueue(tracks, '1');
      
      expect(manager.queue).toHaveLength(2);
      expect(manager.queueIndex).toBe(0);
      expect(onStateChange).toHaveBeenCalled();
    });

    it('should set the queue and select specific track index', () => {
      const tracks = [createSong('1'), createSong('2'), createSong('3')];
      manager.setQueue(tracks, '2');
      
      expect(manager.queueIndex).toBe(1);
    });
  });

  describe('shuffle and repeat', () => {
    it('should toggle shuffle and maintain current track at index 0', () => {
      const tracks = [createSong('1'), createSong('2'), createSong('3')];
      manager.setQueue(tracks, '2'); // current is '2' at index 1
      
      manager.toggleShuffle();
      
      expect(manager.isShuffled).toBe(true);
      expect(manager.queue).toHaveLength(3);
      expect(manager.queue[0].id).toBe('2'); // '2' should be at index 0
      expect(manager.queueIndex).toBe(0);
    });

    it('should unshuffle and restore original order', () => {
      const tracks = [createSong('1'), createSong('2'), createSong('3')];
      manager.setQueue(tracks, '2');
      manager.toggleShuffle();
      manager.toggleShuffle(); // toggle off
      
      expect(manager.isShuffled).toBe(false);
      expect(manager.queue[1].id).toBe('2');
      expect(manager.queueIndex).toBe(1);
    });

    it('should cycle repeat mode', () => {
      manager.cycleRepeatMode();
      expect(manager.repeatMode).toBe('all');
      
      manager.cycleRepeatMode();
      expect(manager.repeatMode).toBe('one');
      
      manager.cycleRepeatMode();
      expect(manager.repeatMode).toBe('none');
    });
  });

  describe('queue manipulation', () => {
    it('should add to queue (manual tracks before autoplay)', () => {
      manager.setQueue([createSong('1'), createSong('2', true)]);
      manager.addToQueue(createSong('3')); // should insert before '2'
      
      expect(manager.queue[1].id).toBe('3');
      expect(manager.queue[2].id).toBe('2');
    });

    it('should play next by inserting right after current index', () => {
      manager.setQueue([createSong('1'), createSong('2')]);
      manager.setIndex(0);
      
      manager.playNext(createSong('3'));
      
      expect(manager.queue[1].id).toBe('3');
      expect(manager.queue[2].id).toBe('2');
    });

    it('should remove from queue', () => {
      manager.setQueue([createSong('1'), createSong('2'), createSong('3')]);
      manager.setIndex(0);
      
      manager.removeFromQueue('2');
      
      expect(manager.queue).toHaveLength(2);
      expect(manager.queue.find(t => t.id === '2')).toBeUndefined();
    });

    it('should clear queue keeping only history and current track', () => {
      manager.setQueue([createSong('1'), createSong('2'), createSong('3'), createSong('4')]);
      manager.setIndex(1); // '2' is current
      
      manager.clearQueue();
      
      expect(manager.queue).toHaveLength(2);
      expect(manager.queue[0].id).toBe('1');
      expect(manager.queue[1].id).toBe('2');
    });
  });

  describe('navigation', () => {
    it('should get next index', () => {
      manager.setQueue([createSong('1'), createSong('2')], '1');
      expect(manager.getNextIndex()).toBe(1);
    });

    it('should return null for next index if at end and no repeat', () => {
      manager.setQueue([createSong('1')], '1');
      expect(manager.getNextIndex()).toBeNull();
    });

    it('should wrap around if repeat all', () => {
      manager.setQueue([createSong('1')], '1');
      manager.cycleRepeatMode(); // 'all'
      expect(manager.getNextIndex()).toBe(0);
    });

    it('should get prev index and wrap around', () => {
      manager.setQueue([createSong('1'), createSong('2')]);
      manager.setIndex(0);
      expect(manager.getPrevIndex()).toBe(1); // wraps to end
    });
  });
});
