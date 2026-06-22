export interface LrcWord {
  text: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export interface LrcLine {
  time: number; // seconds
  duration?: number; // seconds, used for YRC exact duration or LRC sweep
  text: string;
  isPlaceholder?: boolean;
  bgText?: string;
  words?: LrcWord[]; // Only present for YRC
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
    
    // Skip Netease metadata / credit lines (so they don't trigger Chinese romanization on Indo/English songs)
    if (/^(作词|作曲|编曲|制作人|混音|母带|企划|吉他|和声|演唱|OP|SP|发行|出品|录音|监制|设计|Vocal)\s*[:：]/.test(stripped)) {
      continue;
    }

    const textNoSpaces = stripped.replace(/\s+/g, '');
    const isPlaceholder = stripped.length === 0 || (textNoSpaces.length > 0 && /^[●·.…♪■◼⬛▪]+$/.test(textNoSpaces));
    let text = isPlaceholder ? '...' : stripped;
    let bgText: string | undefined;

    if (!isPlaceholder) {
      const bgMatch = text.match(/(.+?)\s*\(([^)]+)\)$/);
      if (bgMatch) {
        text = bgMatch[1].trim();
        bgText = bgMatch[2].trim();
      }
    }

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
        bgText,
      });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export function parseYRC(yrc: string): LrcLine[] {
  if (!yrc) return [];
  const lines = yrc.split('\n');
  const result: LrcLine[] = [];

  // yrc format: [line_start, line_duration](word_start, word_duration, something)word
  const lineRegex = /^\[(\d+),(\d+)\](.*)/;
  const wordRegex = /\((\d+),(\d+),\d+\)([^\(]+)/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip JSON metadata lines that sometimes appear at the beginning of YRC
    if (trimmed.startsWith('{')) continue;

    const lineMatch = trimmed.match(lineRegex);
    if (!lineMatch) continue;

    const lineStartMs = parseInt(lineMatch[1], 10);
    const lineDurationMs = parseInt(lineMatch[2], 10);
    const content = lineMatch[3];

    const words: LrcWord[] = [];
    let fullText = '';

    const wordMatches = [...content.matchAll(wordRegex)];
    for (const wm of wordMatches) {
      const wStartMs = parseInt(wm[1], 10);
      const wDurationMs = parseInt(wm[2], 10);
      const wText = wm[3];

      words.push({
        text: wText,
        startTime: wStartMs / 1000,
        endTime: (wStartMs + wDurationMs) / 1000,
      });
      fullText += wText;
    }

    if (words.length > 0) {
      // Skip Netease metadata / credit lines
      if (/^(作词|作曲|编曲|制作人|混音|母带|企划|吉他|和声|演唱|OP|SP|发行|出品|录音|监制|设计|Vocal)\s*[:：]/.test(fullText.trim())) {
        continue;
      }

      // Check if the entire line consists of placeholder characters (dots, bullets, squares, etc.)
      const textNoSpaces = fullText.replace(/\s+/g, '');
      const isPlaceholder = textNoSpaces.length > 0 && /^[●·.…♪■◼⬛▪]+$/.test(textNoSpaces);

      result.push({
        time: lineStartMs / 1000,
        duration: lineDurationMs / 1000,
        text: fullText,
        isPlaceholder,
        words,
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

  const introThreshold = options.introThresholdSec ?? 10;
  const gapThreshold = options.gapThresholdSec ?? 10;
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

    const rawGap = next.time - current.time;
    // We already estimated duration for LRC, or exact for YRC.
    // If not, just fallback logic for placeholders
    const currentDuration = current.duration || (rawGap < 4 ? rawGap * 0.9 : rawGap < 8 ? rawGap * 0.75 : rawGap * 0.6);
    const remainingSilence = rawGap - currentDuration;

    if (remainingSilence > gapThreshold) {
      const placeholderTime = current.time + currentDuration + 1;
      const placeholderDuration = Math.max(0, next.time - placeholderTime);

      const words: LrcWord[] = [
        { text: '●', startTime: placeholderTime, endTime: placeholderTime + placeholderDuration * 0.33 },
        { text: ' ●', startTime: placeholderTime + placeholderDuration * 0.33, endTime: placeholderTime + placeholderDuration * 0.66 },
        { text: ' ●', startTime: placeholderTime + placeholderDuration * 0.66, endTime: placeholderTime + placeholderDuration },
      ];

      result.push({
        time: placeholderTime,
        duration: placeholderDuration,
        text: '● ● ●',
        isPlaceholder: true,
        words,
      });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export function estimateLineDurations(lines: LrcLine[]): LrcLine[] {
  if (lines.length === 0) return lines;

  return lines.map((line, idx) => {
    // If it already has duration from YRC, preserve it
    if (line.duration !== undefined) {
      return line;
    }

    const nextLine = lines[idx + 1];
    const rawGap = nextLine ? nextLine.time - line.time : 5;

    // Line duration sweep estimation for standard LRC: 80% of gap, capped at 10s
    let duration = Math.min(rawGap * 0.8, 10);
    if (duration < 1) duration = 1; // Minimum sweep time 1s

    if (line.isPlaceholder || !line.text || line.text === '...') {
      // Create animated dots for placeholders
      const words: LrcWord[] = [
        { text: '●', startTime: line.time, endTime: line.time + duration * 0.33 },
        { text: ' ●', startTime: line.time + duration * 0.33, endTime: line.time + duration * 0.66 },
        { text: ' ●', startTime: line.time + duration * 0.66, endTime: line.time + duration },
      ];
      return { ...line, duration, text: '● ● ●', isPlaceholder: true, words };
    }

    // We can populate 'words' with a single dummy word covering the entire line
    // to unify the animator component, but splitting into individual words for layout
    // is safer for wrapping logic (per user advice).
    // Let's split layout words but share the same timeline using start/end derived proportionally.
    const tokens = line.text.split(/(\s+)/); // Keep spaces intact
    const words: LrcWord[] = [];

    // For sweep, just distribute the total duration evenly across non-empty characters
    const totalChars = line.text.replace(/\s+/g, '').length;
    let currentStart = line.time;

    if (totalChars === 0) {
      words.push({ text: line.text, startTime: line.time, endTime: line.time + duration });
    } else {
      for (const token of tokens) {
        if (!token) continue;
        const charCount = token.replace(/\s+/g, '').length;
        const wordDuration = totalChars > 0 ? (charCount / totalChars) * duration : 0;

        words.push({
          text: token,
          startTime: currentStart,
          endTime: currentStart + wordDuration,
        });
        currentStart += wordDuration;
      }
    }

    return { ...line, duration, words };
  });
}
