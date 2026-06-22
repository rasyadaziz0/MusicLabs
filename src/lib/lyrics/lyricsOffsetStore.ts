const DEFAULT_LEAD_IN_SEC = 0.0025;
export function getEffectiveTime(currentTime: number, _trackId?: string | null): number {
  return Math.max(0, currentTime + DEFAULT_LEAD_IN_SEC);
}
export const LEAD_IN_SEC = DEFAULT_LEAD_IN_SEC;
