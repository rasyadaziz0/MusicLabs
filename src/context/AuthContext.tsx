'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { AuthService } from '@/lib/services/AuthService';

import { AuthContextType } from '@/types/context/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const authService = AuthService.getInstance();

  const signInWithGoogle = (redirectPath = '/') => authService.signInWithGoogle(redirectPath);
  
  const signInWithPassword = (email: string, password: string, captchaToken?: string) => 
    authService.signInWithPassword(email, password, captchaToken);
    
  const signUpWithPassword = (email: string, password: string, fullName: string, captchaToken?: string) => 
    authService.signUpWithPassword(email, password, fullName, captchaToken);
    
  const signOut = () => authService.signOut();
  
  const resetPasswordForEmail = (email: string, captchaToken?: string) => 
    authService.resetPasswordForEmail(email, captchaToken);
    
  const updatePassword = (password: string) => authService.updatePassword(password);
  
  const updateProfile = async (data: any) => {
    const result = await authService.updateProfile(data);
    if (result.user) {
      setUser(result.user); // Update local state directly if profile changes
    }
    return { error: result.error };
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
