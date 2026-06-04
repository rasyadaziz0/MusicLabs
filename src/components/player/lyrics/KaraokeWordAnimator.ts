import { LrcWord } from '@/lib/utils/lrcParser';
import { subscribeToTime } from '@/hooks/useHighPrecisionTime';

export interface KaraokeWordAnimatorOptions {
  activeColor: string;
  inactiveColor: string;
  activeShadow?: string;
}

export class KaraokeWordAnimator {
  private word: LrcWord;
  private options: KaraokeWordAnimatorOptions;
  private spanElement: HTMLSpanElement | null = null;
  private lastPercent: number = -1;
  private isRTL: boolean;
  private angle: string;
  private unsubscribe: (() => void) | null = null;

  constructor(word: LrcWord, options: KaraokeWordAnimatorOptions) {
    this.word = word;
    this.options = options;
    this.isRTL = /[\u0590-\u083F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(word.text);
    this.angle = this.isRTL ? '-90deg' : '90deg';
  }

  attach(span: HTMLSpanElement) {
    this.spanElement = span;
    this.start();
  }

  detach() {
    this.stop();
    this.spanElement = null;
  }

  private start() {
    if (this.unsubscribe) return;
    this.unsubscribe = subscribeToTime(this.update);
  }

  private stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private update = (currentTime: number) => {
    const span = this.spanElement;
    if (!span) return;

    let progress: number;
    if (currentTime >= this.word.endTime) {
      progress = 1;
    } else if (currentTime <= this.word.startTime) {
      progress = 0;
    } else {
      const duration = this.word.endTime - this.word.startTime;
      progress = duration <= 0 ? 1 : (currentTime - this.word.startTime) / duration;
    }

    const fillPercent = Math.round(progress * 100);
    if (fillPercent === this.lastPercent) return;
    this.lastPercent = fillPercent;

    const { activeColor, inactiveColor, activeShadow } = this.options;

    if (fillPercent <= 0) {
      span.style.color = inactiveColor;
      span.style.backgroundImage = '';
      span.style.webkitBackgroundClip = '';
      span.style.backgroundClip = '';
      span.style.webkitTextFillColor = '';
      if (activeShadow !== undefined) span.style.textShadow = '';
    } else if (fillPercent >= 100) {
      span.style.color = activeColor;
      span.style.backgroundImage = '';
      span.style.webkitBackgroundClip = '';
      span.style.backgroundClip = '';
      span.style.webkitTextFillColor = '';
      if (activeShadow !== undefined) span.style.textShadow = activeShadow;
    } else {
      span.style.color = '';
      span.style.backgroundImage = `linear-gradient(${this.angle}, ${activeColor} ${fillPercent}%, ${inactiveColor} ${fillPercent}%)`;
      span.style.webkitBackgroundClip = 'text';
      span.style.backgroundClip = 'text';
      span.style.webkitTextFillColor = 'transparent';
      if (activeShadow !== undefined) span.style.textShadow = 'none';
    }
  };
}
