'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import TurnstileWidget from '@/components/auth/TurnstileWidget';

export default function LoginForm() {
  const { user, loading, signInWithGoogle, signInWithPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const raw = searchParams.get('next');
    if (!raw) return '/';

    try {
      // Pastikan path aman dan dari origin yang sama
      const url = new URL(raw, window.location.origin);
      if (url.origin !== window.location.origin) return '/';
      
      const safePath = url.pathname + url.search;
      if (!safePath.startsWith('/') || safePath.startsWith('//')) return '/';
      return safePath;
    } catch {
      return '/';
    }
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captchaToken, setCaptchaToken] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, nextPath, router, user]);

  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      return 'Email dan password wajib diisi.';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Format email tidak valid.';
    }
    if (password.length < 6) {
      return 'Password minimal 6 karakter.';
    }
    if (!captchaToken) {
      return 'Tolong selesaikan verifikasi captcha.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signInWithPassword(email.trim(), password, captchaToken);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
      setFailedAttempts((prev) => prev + 1);
      return;
    }

    router.replace(nextPath);
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle(nextPath);
    setIsGoogleLoading(false);

    if (error) {
      setErrorMessage(error);
    }
  };

  return (
    <main className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Masuk ke AcadMusic</h1>
          <p className="mt-2 text-sm text-muted">Pindah sini aja, di sini gak ada iklan nya.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/90">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary/70 focus:outline-none"
              placeholder="nama@email.com"
              autoComplete="email"
              suppressHydrationWarning
              data-lpignore="true"
              data-1p-ignore
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-10 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary/70 focus:outline-none"
                placeholder="Masukkan password"
                autoComplete="current-password"
                suppressHydrationWarning
                data-lpignore="true"
                data-1p-ignore
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="space-y-3">
              <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                {errorMessage}
              </p>
              
              {failedAttempts >= 3 && (
                <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary/90 text-center animate-in fade-in slide-in-from-top-2">
                  <p className="mb-2">Lupa akun atau password?</p>
                  <Link 
                    href="/forgot-password" 
                    className="inline-block rounded-lg bg-primary/20 hover:bg-primary/30 px-4 py-1.5 font-medium transition-colors"
                  >
                    Reset Password
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center">
            <TurnstileWidget onSuccess={(token) => setCaptchaToken(token)} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wider text-white/40">atau</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting || isGoogleLoading}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleLoading ? 'Mengarahkan ke Google...' : 'Lanjutkan dengan Google'}
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          Gak punya akun? langsung {' '}
          <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-white hover:text-primary">
            Daftar Aja
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
          Dengan mendaftar atau masuk, kamu setuju dengan{' '}
          <Link href="/terms" className="text-white/80 underline hover:text-white transition-colors">
            Terms of Use
          </Link>{' '}
          dan{' '}
          <Link href="/privacy" className="text-white/80 underline hover:text-white transition-colors">
            Privacy Policy
          </Link>{' '}
          AcadMusic.
        </p>
      </section>
    </main>
  );
}
