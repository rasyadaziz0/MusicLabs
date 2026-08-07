import { supabase } from '@/lib/supabase/client';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { AuthActionResult } from '@/types/context/auth';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private mapAuthErrorMessage(action: 'login' | 'register' | 'google' | 'logout'): string {
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

  public async signInWithGoogle(redirectPath: string = '/'): Promise<AuthActionResult> {
    const redirectTarget = redirectPath.startsWith('/') ? redirectPath : '/';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = new URL('/auth/callback', origin || 'http://localhost:3000');
    callbackUrl.searchParams.set('next', redirectTarget);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      console.error('Auth signInWithGoogle gagal:', error);
      return { error: this.mapAuthErrorMessage('google') };
    }
    return { error: null };
  }

  public async signInWithPassword(email: string, password: string, captchaToken?: string): Promise<AuthActionResult> {
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: captchaToken ? { captchaToken } : undefined
    });

    if (error) {
      console.error('Auth signInWithPassword gagal:', error);
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return { error: 'Email belum diverifikasi. Silakan cek kotak masuk email kamu.' };
      }
      return { error: this.mapAuthErrorMessage('login') };
    }
    return { error: null };
  }

  public async signUpWithPassword(email: string, password: string, fullName: string, captchaToken?: string): Promise<AuthActionResult> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = new URL('/auth/callback', origin || 'http://localhost:3000');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: callbackUrl.toString(),
        ...(captchaToken ? { captchaToken } : {})
      },
    });

    if (error) {
      console.error('Auth signUpWithPassword gagal:', error);
      return { error: this.mapAuthErrorMessage('register') };
    }

    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      return { error: 'Email udah ada, langsung login aja ;)' };
    }

    return { error: null };
  }

  public async signOut(): Promise<AuthActionResult> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Auth signOut gagal:', error);
      return { error: this.mapAuthErrorMessage('logout') };
    }
    return { error: null };
  }

  public async resetPasswordForEmail(email: string, captchaToken?: string): Promise<AuthActionResult> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = new URL('/update-password', origin || 'http://localhost:3000');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl.toString(),
      ...(captchaToken ? { captchaToken } : {})
    });

    if (error) {
      console.error('Auth resetPasswordForEmail gagal:', error);
      return { error: 'Gagal mengirim link reset password. Pastikan email terdaftar dan coba lagi.' };
    }
    return { error: null };
  }

  public async updatePassword(password: string): Promise<AuthActionResult> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error('Auth updatePassword gagal:', error);
      return { error: 'Gagal memperbarui password. Silakan coba lagi.' };
    }
    return { error: null };
  }

  public async updateProfile(data: { 
    username?: string; name?: string; bio?: string; avatarUrl?: string;
    bannerUrl?: string;
    socialInstagram?: string; socialTwitter?: string; socialTiktok?: string;
    isPublic?: boolean; showNowPlaying?: boolean; showRecentlyPlayed?: boolean;
    lyricsFontSize?: string; romanizationEnabled?: boolean;
    searchRegion?: string;
  }): Promise<{ error: string | null; user?: any }> {
    const authUpdateData: any = {};
    if (data.name !== undefined) authUpdateData.name = data.name;
    if (data.avatarUrl !== undefined) authUpdateData.avatar_url = data.avatarUrl;

    const { data: userData, error: authError } = await supabase.auth.updateUser({
      data: authUpdateData
    });

    if (authError) {
      console.error('Auth updateProfile gagal (auth):', authError);
      return { error: 'Gagal memperbarui profil auth. Silakan coba lagi.' };
    }

    if (userData.user) {
      if (data.username !== undefined) {
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', data.username)
          .neq('id', userData.user.id)
          .maybeSingle();
          
        if (checkError) {
          console.error('Error checking username:', checkError);
        } else if (existingUser) {
          return { error: 'Nama pengguna sudah terpakai oleh user lain. Silakan pilih yang lain.' };
        }
      }

      const profileUpdates: any = {};
      if (data.username !== undefined) profileUpdates.username = data.username;
      if (data.name !== undefined) profileUpdates.display_name = data.name;
      if (data.bio !== undefined) profileUpdates.bio = data.bio;
      if (data.avatarUrl !== undefined) profileUpdates.avatar_url = data.avatarUrl;
      if (data.bannerUrl !== undefined) profileUpdates.banner_url = data.bannerUrl;
      if (data.socialInstagram !== undefined) profileUpdates.social_instagram = data.socialInstagram;
      if (data.socialTwitter !== undefined) profileUpdates.social_twitter = data.socialTwitter;
      if (data.socialTiktok !== undefined) profileUpdates.social_tiktok = data.socialTiktok;
      if (data.isPublic !== undefined) profileUpdates.is_public = data.isPublic;
      if (data.showNowPlaying !== undefined) profileUpdates.show_now_playing = data.showNowPlaying;
      if (data.showRecentlyPlayed !== undefined) profileUpdates.show_recently_played = data.showRecentlyPlayed;
      if (data.lyricsFontSize !== undefined) profileUpdates.lyrics_font_size = data.lyricsFontSize;
      if (data.romanizationEnabled !== undefined) profileUpdates.romanization_enabled = data.romanizationEnabled;
      if (data.searchRegion !== undefined) profileUpdates.search_region = data.searchRegion;

      try {
        await ProfileRepository.getInstance().updateProfile(userData.user.id, profileUpdates);
      } catch (profileError) {
        console.error('Auth updateProfile gagal (profiles):', profileError);
      }
      
      return { error: null, user: userData.user };
    }
    
    return { error: null };
  }
}
