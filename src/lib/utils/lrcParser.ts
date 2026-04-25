export interface LrcLine {
  time: number; // seconds
  text: string;
}

export function parseLRC(lrc: string): LrcLine[] {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const result: LrcLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();
    if (!text || matches.length === 0) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const msStr = match[3].padEnd(3, '0');
      const ms = parseInt(msStr);
      result.push({ time: minutes * 60 + seconds + ms / 1000, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}
