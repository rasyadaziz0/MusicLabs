'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route UI error:', error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h2 className="text-2xl font-bold text-white">Oops, ada gangguan.</h2>
        <p className="mt-3 text-sm text-white/70">
          Halaman ini lagi bermasalah. Coba ulang sebentar lagi.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
        >
          Coba Lagi
        </button>
      </section>
    </main>
  );
}
