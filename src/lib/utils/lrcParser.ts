export interface LrcWord {
  text: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export interface LrcLine {
  time: number; // seconds
  text: string;
  isPlaceholder?: boolean;
  words?: LrcWord[];
  bgText?: string;
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
      // Shift timestamps slightly earlier (150ms) for better perceived rhythm accuracy
      const globalOffset = -0.15;
      const shiftedTime = minutes * 60 + seconds + ms / 1000 + offsetMs / 1000 + globalOffset;
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
    const estimatedVocalDuration =
      rawGap < 4
        ? rawGap * 0.9
        : rawGap < 8
          ? rawGap * 0.75
          : rawGap * 0.6;

    const remainingSilence = rawGap - estimatedVocalDuration;

    if (remainingSilence > gapThreshold) {
      const placeholderTime = current.time + estimatedVocalDuration + 1;

      result.push({
        time: placeholderTime,
        text: '...',
        isPlaceholder: true,
      });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export function addWordTimings(lines: LrcLine[]): LrcLine[] {
  if (lines.length === 0) return lines;

  return lines.map((line, idx) => {
    if (line.isPlaceholder || !line.text || line.text === '...') {
      return line;
    }

    // Estimate actual vocal duration (not full gap) for more realistic pacing
    const nextLine = lines[idx + 1];
    const rawGap = nextLine ? nextLine.time - line.time : 5;

    // Split text into words early so we can use totalWeight for duration estimation
    const rawWords = splitTextIntoWords(line.text);
    if (rawWords.length === 0) return line;
    const totalWeight = rawWords.reduce((sum, w) => sum + getWordWeight(w), 0);

    // 1. ChatGPT's heuristic: assume vocal takes a certain percentage of the gap.
    const gapFractionDuration =
      rawGap < 4
        ? rawGap * 0.9
        : rawGap < 8
          ? rawGap * 0.75
          : rawGap * 0.6;

    const weightBasedDuration = Math.min(totalWeight * 0.6, rawGap * 0.95);

    // Take the larger of the two estimates, but enforce absolute limits (min 2s, max 14s).
    const estimatedVocalDuration = Math.max(gapFractionDuration, weightBasedDuration);
    const lineDuration = Math.min(Math.max(estimatedVocalDuration, 2), 14);

    const words: LrcWord[] = [];
    let currentTime = line.time;

    for (const word of rawWords) {
      const weight = getWordWeight(word);
      const wordDuration = totalWeight > 0 ? (weight / totalWeight) * lineDuration : lineDuration / rawWords.length;
      words.push({
        text: word,
        startTime: currentTime,
        endTime: currentTime + wordDuration,
      });
      currentTime += wordDuration;
    }

    return { ...line, words };
  });
}

function splitTextIntoWords(text: string): string[] {
  const tokens: string[] = [];
  const segments = text.match(/[\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]|[^\s\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]+|\s+/g);

  if (!segments) return [text];

  for (const seg of segments) {
    // Skip pure whitespace, but we still need spacing info
    if (/^\s+$/.test(seg)) {
      // Attach space to previous word for rendering
      if (tokens.length > 0) {
        tokens[tokens.length - 1] += seg;
      }
    } else {
      tokens.push(seg);
    }
  }

  return tokens;
}

/**
 * Word weight heuristic: CJK chars are heavier (more syllables) than Latin chars.
 */
function getWordWeight(word: string): number {
  let w = 0;
  for (const ch of word) {
    const code = ch.codePointAt(0) ?? 0;
    if (
      (code >= 0x3000 && code <= 0x9FFF) ||
      (code >= 0xAC00 && code <= 0xD7AF) ||
      (code >= 0xF900 && code <= 0xFAFF)
    ) {
      w += 1.4; // CJK characters take slightly longer, but not double (prevents J-pop being too slow)
    } else if (/\s/.test(ch)) {
      w += 0; // Spaces don't contribute
    } else {
      w += 1;
    }
  }
  return Math.max(w, 1);
}
