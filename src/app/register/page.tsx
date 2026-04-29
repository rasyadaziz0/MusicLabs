'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Komponen inner yang pakai useSearchParams() — WAJIB dibungkus Suspense
function RegisterForm() {
  const { user, loading, signUpWithPassword, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const raw = searchParams.get('next');
    return raw?.startsWith('/') ? raw : '/';
  }, [searchParams]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, nextPath, router, user]);

  const validateForm = () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      return 'Semua kolom wajib diisi.';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Format email tidak valid.';
    }
    if (password.length < 8) {
      return 'Password minimal 8 karakter.';
    }
    if (password !== confirmPassword) {
      return 'Konfirmasi password tidak sama.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUpWithPassword(email.trim(), password, fullName.trim());
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setSuccessMessage('Akun berhasil dibuat. Cek email untuk verifikasi jika diminta.');
  };

  const handleGoogleRegister = async () => {
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Buat akun MusicLabs</h1>
          <p className="mt-1 text-sm text-muted">Udah muak sama platform yang banyak iklan? Yuk beralih ke MusicLabs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-white/90">
              Username
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary/70 focus:outline-none"
              placeholder="Nama kamu"
              autoComplete="name"
              suppressHydrationWarning
              data-lpignore="true"
              data-1p-ignore
            />
          </div>

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
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              suppressHydrationWarning
              data-lpignore="true"
              data-1p-ignore
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-white/90">
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary/70 focus:outline-none"
              placeholder="Ulangi password"
              autoComplete="new-password"
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

          {successMessage && (
            <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Membuat akun...' : 'Daftar'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wider text-white/40">atau</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleGoogleRegister}
          disabled={isSubmitting || isGoogleLoading}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleLoading ? 'Mengarahkan ke Google...' : 'Daftar dengan Google'}
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          Udah punya akun? ngapain kesini langsung aja{' '}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-white hover:text-primary">
            Masuk :)
          </Link>
        </p>
      </section>
    </main>
  );
}

// Export default pakai Suspense untuk wrap useSearchParams()
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl mb-4" />
          <div className="h-4 bg-white/5 rounded-xl mb-8 w-3/4 mx-auto" />
          <div className="space-y-4">
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-primary/30 rounded-xl" />
          </div>
        </div>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
