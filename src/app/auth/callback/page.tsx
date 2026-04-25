'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { error } = await supabase.auth.getSession();
      if (!error) {
        router.push('/');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-void">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted">Completing login...</p>
      </div>
    </div>
  );
}
