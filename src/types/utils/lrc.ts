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
