import { Session, User } from '@supabase/supabase-js';

export interface AuthActionResult {
  error: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<AuthActionResult>;
  signInWithPassword: (email: string, password: string, captchaToken?: string) => Promise<AuthActionResult>;
  signInWithMagicLink: (email: string, captchaToken?: string) => Promise<AuthActionResult>;
  signUpWithPassword: (email: string, password: string, fullName: string, captchaToken?: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
  resetPasswordForEmail: (email: string, captchaToken?: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  updateProfile: (data: {
    username?: string; name?: string; bio?: string; avatarUrl?: string;
    bannerUrl?: string;
    socialInstagram?: string; socialTwitter?: string; socialTiktok?: string;
    isPublic?: boolean; showNowPlaying?: boolean; showRecentlyPlayed?: boolean;
    lyricsFontSize?: 'small' | 'medium' | 'large';
    romanizationEnabled?: boolean;
    timezone?: string;
  }) => Promise<{ user?: any; error?: string }>;
}
