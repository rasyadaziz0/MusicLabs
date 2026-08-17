import { createClient } from '@/lib/supabase/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side route handler for Supabase email-based auth verification.
 *
 * Handles all email token types:
 * - `magiclink`  → Passwordless login via Magic Link
 * - `signup`     → Email confirmation after registration
 * - `recovery`   → Password reset link
 *
 * Supabase sends the user to this URL with `?token_hash=...&type=...&next=...`.
 * We verify the token server-side using `supabase.auth.verifyOtp()`, which
 * exchanges the one-time token for a full session (setting auth cookies).
 *
 * Architecture note: This is intentionally separate from `/auth/callback/page.tsx`,
 * which handles Google OAuth (implicit flow using `#hash` fragments that can only
 * be read client-side). Email-based tokens use query params, requiring server-side
 * processing.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Validate the `next` path to prevent open redirect attacks
  const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/';

  // Supabase SSR defaults to PKCE flow which sends a `code` instead of `token_hash`
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // For reset password, `next` is already set to `/update-password` by AuthService
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
    
    console.error('[Auth Confirm] exchangeCodeForSession failed:', error.message);
  } else if (token_hash && type) {
    // Legacy / Implicit flow handling
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/update-password', request.url));
      }
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
    
    console.error('[Auth Confirm] verifyOtp failed:', error.message);
  }

  // If neither succeeded or params were missing, redirect to login with error
  const errorUrl = new URL('/login', request.url);
  errorUrl.searchParams.set('error', 'verification_failed');
  return NextResponse.redirect(errorUrl);
}
