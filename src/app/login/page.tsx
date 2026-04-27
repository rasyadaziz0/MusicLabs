'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

// Komponen inner yang pakai useSearchParams() — WAJIB dibungkus Suspense
// agar tidak terjadi hydration mismatch / insertBefore error saat navigasi.
function LoginForm() {
  const { user, loading, signInWithGoogle, signInWithPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const raw = searchParams.get('next');
    return raw?.startsWith('/') ? raw : '/';
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
    const { error } = await signInWithPassword(email.trim(), password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Masuk ke MusicLabs</h1>
          <p className="mt-2 text-sm text-muted">Lanjutkan musikmu dari akun yang sama.</p>
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
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/90">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary/70 focus:outline-none"
              placeholder="Masukkan password"
              autoComplete="current-password"
              suppressHydrationWarning
              data-lpignore="true"
              data-1p-ignore
            />
          </div>

          {errorMessage && (
            <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </p>
          )}

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
      </section>
    </main>
  );
}

// Export default pakai Suspense untuk wrap useSearchParams()
// Ini WAJIB di Next.js App Router — tanpa ini terjadi hydration mismatch
export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl mb-4" />
          <div className="h-4 bg-white/5 rounded-xl mb-8 w-3/4 mx-auto" />
          <div className="space-y-4">
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-primary/30 rounded-xl" />
          </div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
