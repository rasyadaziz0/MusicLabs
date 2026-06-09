'use client';

import { useState, useEffect } from 'react';

const RECENT_SEARCHES_KEY = 'musiclabs_recent_searches';
const MAX_RECENT_SEARCHES = 15;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load recent searches', e);
      }
    }
  }, []);

  const addSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const removeSearch = (query: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => s !== query);
      if (typeof window !== 'undefined') {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const clearAll = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  };

  return { recentSearches, addSearch, removeSearch, clearAll };
}
