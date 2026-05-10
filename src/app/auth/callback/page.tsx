'use client';

import { Suspense, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuth = async () => {
      const nextPath = searchParams.get('next');
      const safeNextPath = (nextPath?.startsWith('/') && !nextPath.startsWith('//')) ? nextPath : '/';

      // Wait for Supabase to detect & process the session from the URL hash/code.
      // onAuthStateChange fires SIGNED_IN once the implicit-flow tokens are ingested.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          router.replace(safeNextPath);
        }
      });

      // Fallback: if the session is already available (e.g. page refresh),
      // redirect immediately instead of waiting for an event that won't fire.
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session) {
        subscription.unsubscribe();
        router.replace(safeNextPath);
        return;
      }

      // Safety timeout — if nothing happens within 8s, redirect anyway
      setTimeout(() => {
        subscription.unsubscribe();
        router.replace(safeNextPath);
      }, 8000);
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="flex h-screen items-center justify-center bg-void">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted">Completing login...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-void">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
