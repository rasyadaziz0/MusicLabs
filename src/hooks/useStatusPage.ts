import { useCallback, useEffect, useState } from 'react';
import type { StatusReport } from '@/lib/services/StatusChecker';

export function useStatusPage(intervalMs = 60_000) {
  const [report, setReport] = useState<StatusReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatusReport = await res.json();
      setReport(data);
      setLastChecked(new Date());
    } catch {
      setReport({
        overall: 'outage',
        timestamp: new Date().toISOString(),
        components: [],
      });
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll(); // initial check

    let id: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!id) {
        id = setInterval(poll, intervalMs);
      }
    };

    const stopPolling = () => {
      if (id) {
        clearInterval(id);
        id = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else {
        poll(); // Refresh immediately on focus
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [poll, intervalMs]);

  return { report, loading, lastChecked, refetch: poll };
}
