'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function UpdatePasswordForm() {
  const { updatePassword } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Memastikan bahwa form ini hanya bisa diakses saat user baru saja mengeklik link recovery
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Mengecek apakah kita punya akses recovery session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setHasValidSession(true);
      } else {
        // Coba tunggu sebentar barangkali session-nya baru diset dari hash URL
        setTimeout(async () => {
          const checkAgain = await supabase.auth.getSession();
          setHasValidSession(!!checkAgain.data.session);
        }, 1000);
      }
    };
    
    checkSession();
  }, []);

  const validateForm = () => {
    if (!password.trim() || !confirmPassword.trim()) {
      return 'Semua kolom wajib diisi.';
    }
    if (password.length < 8) {
      return 'Password minimal 8 karakter.';
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return 'Password harus mengandung kombinasi huruf dan angka.';
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
    const { error } = await updatePassword(password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setSuccessMessage('Password berhasil diperbarui! Silakan masuk kembali.');
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  if (hasValidSession === false) {
    return (
      <main className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-10">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-4">Sesi Tidak Valid</h1>
          <p className="text-sm text-muted mb-6">
            Link reset password tidak valid atau sudah kadaluarsa. Silakan minta tautan baru.
          </p>
          <Link
            href="/forgot-password"
            className="w-full inline-block rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Minta Link Baru
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Buat Password Baru</h1>
          <p className="mt-2 text-sm text-muted">Pastikan password baru Anda kuat dan mudah diingat.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/90">
              Password Baru
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-10 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary/70 focus:outline-none"
                placeholder="Minimal 8 karakter (kombinasi angka & huruf)"
                autoComplete="new-password"
                disabled={!hasValidSession || isSubmitting}
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

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-white/90">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-10 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-primary/70 focus:outline-none"
                placeholder="Ulangi password baru"
                autoComplete="new-password"
                disabled={!hasValidSession || isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
            disabled={!hasValidSession || isSubmitting}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Memperbarui...' : 'Perbarui Password'}
          </button>
        </form>
      </section>
    </main>
  );
}
