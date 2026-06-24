import { describe, it, expect } from 'vitest';
import { parseLRC, parseYRC, addInstrumentalPlaceholders, estimateLineDurations } from './lrcParser';

describe('lrcParser', () => {
  describe('parseLRC', () => {
    it('should parse standard LRC format correctly', () => {
      const lrc = `
[00:01.00]First line
[00:03.50]Second line
[00:10.123]Third line
      `;
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(expect.objectContaining({ time: 1, text: 'First line', isPlaceholder: false }));
      expect(result[1]).toEqual(expect.objectContaining({ time: 3.5, text: 'Second line', isPlaceholder: false }));
      expect(result[2]).toEqual(expect.objectContaining({ time: 10.123, text: 'Third line', isPlaceholder: false }));
    });

    it('should handle offset correctly', () => {
      const lrc = `
[offset:500]
[00:01.00]First line
      `;
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(1);
      // 1.00 + 0.5 = 1.5
      expect(result[0].time).toBe(1.5);
    });

    it('should skip metadata lines', () => {
      const lrc = `
[ti:Title]
[ar:Artist]
[00:01.00]First line
      `;
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('First line');
    });

    it('should skip chinese credit metadata lines', () => {
      const lrc = `
[00:01.00]作词 : Some Writer
[00:02.00]First line
      `;
      const result = parseLRC(lrc);
      
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('First line');
    });
  });

  describe('parseYRC', () => {
    it('should parse YRC format correctly', () => {
      const yrc = `
[1000,2000](1000,500,0)Hello(1500,500,0) World
      `;
      const result = parseYRC(yrc);
      
      expect(result).toHaveLength(1);
      expect(result[0].time).toBe(1); // 1000ms = 1s
      expect(result[0].duration).toBe(2); // 2000ms = 2s
      expect(result[0].text).toBe('Hello World');
      expect(result[0].words).toHaveLength(2);
      expect(result[0].words?.[0]).toEqual({ text: 'Hello', startTime: 1, endTime: 1.5 });
      expect(result[0].words?.[1]).toEqual({ text: ' World', startTime: 1.5, endTime: 2 });
    });
  });

  describe('estimateLineDurations', () => {
    it('should estimate duration based on gap', () => {
      const lines = [
        { time: 0, text: 'Line 1' },
        { time: 5, text: 'Line 2' },
      ];
      
      const result = estimateLineDurations(lines);
      
      expect(result[0].duration).toBe(4); // 80% of 5s gap
      expect(result[1].duration).toBe(4); // fallback 5s gap -> 80% is 4s
      expect(result[0].words?.length).toBeGreaterThan(0);
    });

    it('should preserve existing duration', () => {
      const lines = [
        { time: 0, text: 'Line 1', duration: 10 },
      ];
      
      const result = estimateLineDurations(lines);
      
      expect(result[0].duration).toBe(10);
    });
  });

  describe('addInstrumentalPlaceholders', () => {
    it('should insert instrumental placeholders between large gaps', () => {
      const lines = [
        { time: 10, text: 'First' },
        { time: 30, text: 'Second' },
      ];
      
      const result = addInstrumentalPlaceholders(lines, 'lrc');
      
      // Intro should be added because time > INTRO_GAP
      // Gap between 10 and 30 should add a placeholder
      expect(result.some(l => l.isPlaceholder)).toBe(true);
    });
  });
});
