'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthActionResult {
  error: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<AuthActionResult>;
  signInWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthErrorMessage(action: 'login' | 'register' | 'google' | 'logout') {
  switch (action) {
    case 'login':
      return 'Login gagal. Cek email/password lalu coba lagi.';
    case 'register':
      return 'Daftar akun gagal. Coba lagi beberapa saat lagi.';
    case 'google':
      return 'Login Google belum berhasil. Coba ulang lagi.';
    case 'logout':
      return 'Logout gagal. Coba ulang lagi.';
    default:
      return 'Terjadi gangguan autentikasi. Coba lagi.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setData = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth getSession gagal:', error);
          setSession(null);
          setUser(null);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Auth getSession error tidak terduga:', error);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (redirectPath = '/') => {
    const redirectTarget = redirectPath.startsWith('/') ? redirectPath : '/';
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    callbackUrl.searchParams.set('next', redirectTarget);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
    if (error) {
      console.error('Auth signInWithGoogle gagal:', error);
      return { error: mapAuthErrorMessage('google') };
    }
    return { error: null };
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Auth signInWithPassword gagal:', error);
      return { error: mapAuthErrorMessage('login') };
    }
    return { error: null };
  };

  const signUpWithPassword = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      console.error('Auth signUpWithPassword gagal:', error);
      return { error: mapAuthErrorMessage('register') };
    }
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Auth signOut gagal:', error);
      return { error: mapAuthErrorMessage('logout') };
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signInWithGoogle, signInWithPassword, signUpWithPassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
