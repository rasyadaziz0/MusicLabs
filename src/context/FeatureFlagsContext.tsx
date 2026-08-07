'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

import { FeatureFlagsContextType } from '@/types/context/featureflags';

type FeatureFlags = Record<string, boolean>;

const defaultFlags: FeatureFlags = {
  feature_import_playlist: true,
  feature_import_playlist_auth: true,
  feature_import_playlist_url: true,
  feature_identify: true,
  feature_radio: true,
  feature_recap: true,
  feature_ai_discover: true,
  feature_tip: true,
  feature_public_profiles: true,
  feature_google_login: true,
  feature_manual_register: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: defaultFlags,
  loading: true,
});

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchFlags() {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('id, is_enabled');

        if (error) {
          console.error('Error fetching feature flags:', error);
          // Silently fail and use defaults
          if (isMounted) setLoading(false);
          return;
        }

        if (data && isMounted) {
          const fetchedFlags = data.reduce((acc, row) => {
            acc[row.id] = !!row.is_enabled;
            return acc;
          }, {} as FeatureFlags);

          setFlags((prev) => ({ ...prev, ...fetchedFlags }));
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch feature flags:', err);
        if (isMounted) setLoading(false);
      }
    }

    fetchFlags();

    // Optionally set up realtime subscription if needed later
    const subscription = supabase
      .channel('feature_flags_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const { id, is_enabled } = payload.new as any;
            if (id) {
              setFlags((prev) => ({ ...prev, [id]: !!is_enabled }));
            }
          } else if (payload.eventType === 'DELETE') {
             const { id } = payload.old as any;
             if (id) {
               setFlags((prev) => {
                  const newFlags = { ...prev };
                  delete newFlags[id];
                  return newFlags;
               });
             }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
