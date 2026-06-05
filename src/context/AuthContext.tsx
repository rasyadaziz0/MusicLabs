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
  resetPasswordForEmail: (email: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<AuthActionResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthErrorMessage(action: 'login' | 'register' | 'google' | 'logout') {
  switch (action) {
    case 'login':
      return 'Email atau Password salah, coba lagi';
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
      // Jika error karena email belum dikonfirmasi, beri pesan spesifik
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { error: 'Email belum diverifikasi. Silakan cek kotak masuk email kamu.' };
      }
      return { error: mapAuthErrorMessage('login') };
    }
    return { error: null };
  };

  const signUpWithPassword = async (email: string, password: string, fullName: string) => {
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      console.error('Auth signUpWithPassword gagal:', error);
      return { error: mapAuthErrorMessage('register') };
    }

    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      return { error: 'Email udah ada, langsung login aja ;)' };
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

  const resetPasswordForEmail = async (email: string) => {
    const callbackUrl = new URL('/update-password', window.location.origin);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl.toString(),
    });
    if (error) {
      console.error('Auth resetPasswordForEmail gagal:', error);
      return { error: 'Gagal mengirim link reset password. Pastikan email terdaftar dan coba lagi.' };
    }
    return { error: null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error('Auth updatePassword gagal:', error);
      return { error: 'Gagal memperbarui password. Silakan coba lagi.' };
    }
    return { error: null };
  };

  const updateProfile = async (data: { name?: string; avatarUrl?: string }) => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

    const { data: userData, error } = await supabase.auth.updateUser({
      data: updateData
    });

    if (error) {
      console.error('Auth updateProfile gagal:', error);
      return { error: 'Gagal memperbarui profil. Silakan coba lagi.' };
    }

    // Update local state immediately
    if (userData.user) {
      setUser(userData.user);
    }
    
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, session, loading, signInWithGoogle, signInWithPassword, 
        signUpWithPassword, signOut, resetPasswordForEmail, updatePassword, updateProfile 
      }}
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
