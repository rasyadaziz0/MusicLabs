export interface LrcLine {
  time: number; // seconds
  text: string;
  isPlaceholder?: boolean;
}

export function parseLRC(lrc: string): LrcLine[] {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const result: LrcLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  const offsetMatch = lrc.match(/\[offset:([+-]?\d+)\]/i);
  const offsetMs = offsetMatch ? Number(offsetMatch[1]) : 0;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    if (matches.length === 0) continue;
    const stripped = line.replace(timeRegex, '').replace(/\[[^\]]+\]/g, '').trim();
    const isPlaceholder = stripped.length === 0;
    const text = isPlaceholder ? '...' : stripped;

    for (const match of matches) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const msStr = match[3].padEnd(3, '0');
      const ms = parseInt(msStr);
      const shiftedTime = minutes * 60 + seconds + ms / 1000 + offsetMs / 1000;
      result.push({
        time: Math.max(0, shiftedTime),
        text,
        isPlaceholder,
      });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

interface InstrumentalOptions {
  introThresholdSec?: number;
  gapThresholdSec?: number;
}

export function addInstrumentalPlaceholders(
  sourceLines: LrcLine[],
  options: InstrumentalOptions = {}
): LrcLine[] {
  if (sourceLines.length === 0) return [];

  const introThreshold = options.introThresholdSec ?? 2;
  const gapThreshold = options.gapThresholdSec ?? 8;
  const lines = [...sourceLines].sort((a, b) => a.time - b.time);
  const result: LrcLine[] = [];

  if (lines[0].time > introThreshold) {
    result.push({ time: 0, text: '...', isPlaceholder: true });
  }

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    const next = lines[index + 1];
    result.push(current);

    if (!next) continue;
    const gap = next.time - current.time;
    if (gap > gapThreshold) {
      const placeholderTime = current.time + Math.min(gap * 0.4, 5);
      result.push({
        time: placeholderTime,
        text: '...',
        isPlaceholder: true,
      });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}
