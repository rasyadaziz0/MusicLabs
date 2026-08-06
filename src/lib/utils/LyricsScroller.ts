export class LyricsScroller {
  private static animFrameId: number | null = null;

  /* Cubic-bezier easing — easeOutQuart for a gentle deceleration */
  private static easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  public static scrollToCenter(
    container: HTMLElement, 
    activeElement: HTMLElement, 
    duration: number = 550
  ): void {
    const containerRect = container.getBoundingClientRect();
    const lineRect = activeElement.getBoundingClientRect();
    const lineCenter = lineRect.top + lineRect.height / 2;
    const containerCenter = containerRect.top + containerRect.height / 2;
    const scrollOffset = lineCenter - containerCenter;
    const targetScroll = container.scrollTop + scrollOffset;

    this.smoothScrollTo(container, targetScroll, duration);
  }

  public static smoothScrollTo(container: HTMLElement, targetY: number, duration: number): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const startY = container.scrollTop;
    const diff = targetY - startY;

    /* Skip animation for tiny movements */
    if (Math.abs(diff) < 2) {
      container.scrollTop = targetY;
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutQuart(progress);

      container.scrollTop = startY + diff * eased;

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  public static cleanup(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
