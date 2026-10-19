export class MenuPositionCalculator {
  /**
   * Calculates whether a floating dropdown menu should open upwards
   * based on the remaining viewport space below the target element.
   */
  public static shouldOpenUpward(
    element: HTMLElement | null,
    minSpaceBelow = 420
  ): boolean {
    if (!element || typeof window === 'undefined') return false;
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    return spaceBelow < minSpaceBelow && spaceAbove > spaceBelow;
  }
}
