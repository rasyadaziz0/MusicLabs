export interface SleepTimerState {
  endTime: number | null;
}

export interface SleepTimerOptions {
  onTimeout: () => void;
  onStateChange?: (state: SleepTimerState) => void;
}

export class SleepTimer {
  private timeoutId: NodeJS.Timeout | null = null;
  private endTime: number | null = null;
  private onTimeout: () => void;
  private onStateChange?: (state: SleepTimerState) => void;

  constructor(options: SleepTimerOptions) {
    this.onTimeout = options.onTimeout;
    this.onStateChange = options.onStateChange;
  }

  public start(minutes: number): void {
    this.stop(); // Clear any existing timer

    const ms = minutes * 60 * 1000;
    this.endTime = Date.now() + ms;

    this.timeoutId = setTimeout(() => {
      this.endTime = null;
      this.timeoutId = null;
      this.notifyStateChange();
      this.onTimeout();
    }, ms);

    this.notifyStateChange();
  }

  public stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.endTime !== null) {
      this.endTime = null;
      this.notifyStateChange();
    }
  }

  public getEndTime(): number | null {
    return this.endTime;
  }

  public destroy(): void {
    this.stop();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ endTime: this.endTime });
    }
  }
}
