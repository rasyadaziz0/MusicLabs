export interface SleepTimerState {
  endTime: number | null;
}

export interface SleepTimerOptions {
  onTimeout: () => void;
  onStateChange?: (state: SleepTimerState) => void;
}
