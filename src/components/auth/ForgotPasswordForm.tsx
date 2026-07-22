'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordForm() {
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Email wajib diisi.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Format email tidak valid.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await resetPasswordForEmail(email.trim());
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setSuccessMessage('Tautan reset password berhasil dikirim! Silakan cek kotak masuk email Anda.');
  };

  return (
    <main className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Lupa Password?</h1>
          <p className="mt-2 text-sm text-muted">Masukkan email yang terdaftar, kami akan mengirimkan tautan untuk membuat password baru.</p>
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
              required
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
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Mengirim tautan...' : 'Kirim Tautan Reset'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Ingat password Anda?{' '}
          <Link href="/login" className="font-semibold text-white hover:text-primary">
            Masuk di sini
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
          Dengan menggunakan layanan kami, kamu setuju dengan{' '}
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
