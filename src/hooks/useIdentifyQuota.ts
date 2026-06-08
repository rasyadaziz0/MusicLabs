'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const MAX_MONTHLY_REQUESTS = 300;

interface UseIdentifyQuotaReturn {
  remaining: number;
  used: number;
  isExhausted: boolean;
  consume: () => void;
  isLoading: boolean;
}

/**
 * Tracks AudD free tier usage (300 requests/month) globally across all users in Supabase.
 * Auto-resets when a new month starts.
 */
export function useIdentifyQuota(): UseIdentifyQuotaReturn {
  const [used, setUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuota = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('api_quotas')
        .select('used_count, reset_at')
        .eq('id', 'audd')
        .single();

      if (error) {
        console.error('Error fetching identify quota:', error);
        setIsLoading(false);
        return;
      }

      let count = data.used_count ?? 0;
      let resetAt = data.reset_at ? new Date(data.reset_at) : null;
      const now = new Date();

      if (!resetAt || now > resetAt) {
        // Need to reset globally
        count = 0;
        
        // Calculate next reset date (start of next month)
        const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        // Optimistically update
        setUsed(0);
        
        // Background update
        await supabase
          .from('api_quotas')
          .update({
            used_count: 0,
            reset_at: nextReset.toISOString(),
          })
          .eq('id', 'audd');
      } else {
        setUsed(count);
      }
    } catch (e) {
      console.error('Failed to process quota', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const remaining = Math.max(0, MAX_MONTHLY_REQUESTS - used);
  const isExhausted = remaining <= 0;

  const consume = useCallback(async () => {
    // Optimistic update
    const newUsed = used + 1;
    setUsed(newUsed);

    try {
      // In a high-traffic app, an RPC increment would be safer here to prevent race conditions.
      // But for this scale, direct update is okay.
      await supabase
        .from('api_quotas')
        .update({ used_count: newUsed })
        .eq('id', 'audd');
    } catch (error) {
       console.error('Error consuming quota:', error);
    }
  }, [used]);

  return { remaining, used, isExhausted, consume, isLoading };
}
