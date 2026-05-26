'use client';

import { useCallback, useEffect, useState } from 'react';

const MAX_MONTHLY_REQUESTS = 300;

function getCurrentMonthKey(): string {
  const now = new Date();
  return `audd_quota_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getUsedCount(): number {
  if (typeof window === 'undefined') return 0;
  const key = getCurrentMonthKey();
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) || 0 : 0;
}

function setUsedCount(count: number): void {
  if (typeof window === 'undefined') return;
  const key = getCurrentMonthKey();
  localStorage.setItem(key, String(count));
}

interface UseIdentifyQuotaReturn {
  remaining: number;
  used: number;
  isExhausted: boolean;
  consume: () => void;
}

/**
 * Tracks AudD free tier usage (300 requests/month) in localStorage.
 * Auto-resets when a new month starts (different key per month).
 */
export function useIdentifyQuota(): UseIdentifyQuotaReturn {
  const [used, setUsed] = useState(0);

  useEffect(() => {
    setUsed(getUsedCount());
  }, []);

  const remaining = Math.max(0, MAX_MONTHLY_REQUESTS - used);
  const isExhausted = remaining <= 0;

  const consume = useCallback(() => {
    const newUsed = getUsedCount() + 1;
    setUsedCount(newUsed);
    setUsed(newUsed);
  }, []);

  return { remaining, used, isExhausted, consume };
}
