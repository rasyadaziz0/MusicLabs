export class KaraokeWordAnimator {
  private spans: HTMLElement[] = [];
  private rafId: number | null = null;
  private isAnimating = false;
  private baseTime = 0;
  private lastSystemTime = 0;
  private lastRenderTime: number | null = null;

  constructor(container: HTMLElement) {
    this.spans = Array.from(container.querySelectorAll('.karaoke-word'));
  }

  public updateTime(time: number) {
    this.baseTime = time;
    this.lastSystemTime = performance.now();
    if (!this.isAnimating) {
      this.animate();
    }
  }

  public stop() {
    this.isAnimating = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private animate = () => {
    this.isAnimating = true;

    // Extrapolate time for 60fps smoothness between React 250ms ticks
    const now = performance.now();
    const delta = (now - this.lastSystemTime) / 1000;
    let renderTime = this.baseTime + delta;

    if (this.lastRenderTime !== null) {
      if (renderTime < this.lastRenderTime && (this.lastRenderTime - renderTime) < 1.0) {
        renderTime = this.lastRenderTime;
      }
    }
    this.lastRenderTime = renderTime;

    let allFinished = true;

    for (const span of this.spans) {
      const start = parseFloat(span.getAttribute('data-start') || '0');
      const end = parseFloat(span.getAttribute('data-end') || '0');

      if (renderTime < start) {
        span.style.setProperty('--progress', '0%');
        span.style.setProperty('--progress-raw', '0');
        span.style.setProperty('--glow', '0');
        allFinished = false;
      } else if (renderTime > end) {
        span.style.setProperty('--progress', '100%');
        span.style.setProperty('--progress-raw', '1');
        span.style.setProperty('--glow', '0');
      } else {
        const duration = end - start;
        const progress = duration > 0 ? (renderTime - start) / duration : 1;
        const p = Math.max(0, Math.min(1, progress));

        span.style.setProperty('--progress', `${(p * 100).toFixed(2)}%`);
        span.style.setProperty('--progress-raw', `${p.toFixed(3)}`);

        // Add a subtle bloom effect in the middle of the word
        const bloom = p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0;
        span.style.setProperty('--glow', bloom.toFixed(3));

        allFinished = false;
      }
    }

    if (allFinished) {
      this.isAnimating = false;
      this.rafId = null;
    } else {
      this.rafId = requestAnimationFrame(this.animate);
    }
  };
}
