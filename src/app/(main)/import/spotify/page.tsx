'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

export default function ImportSpotifyPage() {
  const { user, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const callbackError = searchParams.get('error');
  const callbackErrorCode = searchParams.get('error_code');
  const callbackErrorDescription = searchParams.get('error_description');
  const callbackMessage = callbackError
    ? [callbackErrorCode, callbackErrorDescription].filter(Boolean).join(' - ')
    : '';
  const friendlyConnectError =
    'Gagal connect ke Spotify sekarang. Coba lagi beberapa saat lagi.';

  const handleConnectSpotify = async () => {
    setErrorMessage('');
    setLoading(true);

    const { error } = await supabase.auth.linkIdentity({
      provider: 'spotify',
      options: {
        scopes:
          'user-read-email user-read-private playlist-read-private playlist-read-collaborative',
        redirectTo: `${window.location.origin}/import/spotify`,
      },
    });

    if (error) {
      console.error('Gagal connect Spotify:', error);
      setErrorMessage(friendlyConnectError);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-muted">Import</p>
        <h1 className="text-4xl font-display font-bold">Import Spotify Playlist</h1>
        <p className="mt-3 text-muted">
          Untuk import playlist, Lu bisa Connect ke Spotify dulu...
        </p>
      </section>

      {!user ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h2 className="text-2xl font-bold">Login dulu buat import playlist</h2>
          <p className="mt-2 text-muted">Nanti hasil mapping lagu bisa langsung disimpan ke library kamu.</p>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
          >
            Login with Google
          </button>
        </div>
      ) : (
        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8">
          {callbackMessage && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Gagal connect Spotify😓😓. Bantu support developer buat upgrade akun premium Spotify Developer. bantu suport  {' '}
              <a
                href="https://tako.id/Acadlabs"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-red-100 underline underline-offset-2"
              >
                Di sini🙏🙏
              </a>
              .
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-sm text-muted">Silahkan Login Spotify</p>
            <button
              type="button"
              onClick={handleConnectSpotify}
              disabled={loading}
              className="rounded-full bg-green-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Connecting...' : 'Connect with Spotify'}
            </button>
          </div>
          {errorMessage && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
