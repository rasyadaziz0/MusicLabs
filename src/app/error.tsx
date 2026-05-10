'use client';

import { useEffect, useState } from 'react';

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
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">

        {/* Pulsing icon ring */}
        <div
          className="relative mx-auto mb-8 flex h-[88px] w-[88px] items-center justify-center rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 35%, rgba(250,45,85,0.30), rgba(250,45,85,0.06))',
            border: '1.5px solid rgba(250,45,85,0.28)',
            animation: 'amPulse 2.5s ease-in-out infinite',
          }}
          aria-hidden="true"
        >
          {/* Outer halo ring */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              margin: '-8px',
              border: '1px solid rgba(250,45,85,0.11)',
              animation: 'amPulse 2.5s ease-in-out infinite 0.4s',
            }}
          />
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fa2d55"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Label + title + description */}
        <p
          className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: '#fa2d55', animationDelay: '0.1s' }}
        >
          Terjadi Kesalahan
        </p>

        <h1
          className="mb-3 text-[26px] font-bold tracking-tight text-white"
          style={{ letterSpacing: '-0.02em' }}
        >
          Oops, ada gangguan.
        </h1>

        <p className="mx-auto mb-8 max-w-xs text-[15px] leading-relaxed text-white/55">
          Halaman ini mengalami masalah yang tidak terduga. Coba lagi atau kembali ke beranda.
        </p>

        {/* Action buttons */}
        <div className="mx-auto flex max-w-[280px] flex-col gap-2.5">
          <RetryButton reset={reset} />

          <div className="my-0.5 flex items-center gap-2.5">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/40">atau</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <a
            href="/"
            className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium text-white/55 transition-all hover:bg-white/10 hover:text-white active:scale-[0.97]"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Kembali ke Beranda
          </a>
        </div>

        {/* Error digest badge */}
        {error.digest && (
          <div
            className="mt-8 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[11px] text-white/35"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Error ID:{' '}
            <code className="font-mono text-[10px] text-white/30">{error.digest}</code>
          </div>
        )}
      </div>

      <style>{`
        @keyframes amPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.04); }
        }
        @keyframes amShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .am-shake { animation: amShake 0.45s ease; }
        @keyframes amSpin {
          to { transform: rotate(360deg); }
        }
        .am-spin { animation: amSpin 0.7s linear infinite; display: inline-block; }
      `}</style>
    </main>
  );
}

/* ─── Retry button: handles loading + shake state ─── */
function RetryButton({ reset }: { reset: () => void }) {
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  async function handleClick() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    reset();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-70 ${shaking ? 'am-shake' : ''}`}
      style={{ background: '#fa2d55' }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={loading ? 'am-spin' : ''}
      >
        <path d="M1 4v6h6" />
        <path d="M3.51 15a9 9 0 1 0 .49-4.87" />
      </svg>
      {loading ? 'Memuat ulang…' : 'Coba Lagi'}
    </button>
  );
}