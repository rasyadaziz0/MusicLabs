'use client';

import { Suspense, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const nextPath = searchParams.get('next');
      const safeNextPath = nextPath?.startsWith('/') ? nextPath : '/';
      const { error } = await supabase.auth.getSession();
      if (!error) {
        router.push(safeNextPath);
      }
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
