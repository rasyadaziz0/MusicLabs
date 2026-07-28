'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import FeatureDisabled from '@/components/ui/FeatureDisabled';
import { useImport } from '@/context/ImportContext';
import { ScrapedPlaylist } from '@/lib/scrapers/types';

export default function ImportPlaylistPage() {
  const { flags } = useFeatureFlags();
  const { user, signInWithGoogle } = useAuth();
  const { startImport, isImporting, importProgress } = useImport();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState<'auth' | 'url'>('url');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [scrapedResult, setScrapedResult] = useState<ScrapedPlaylist | null>(null);

  // Sync mode if flags change
  useEffect(() => {
    if (!flags.feature_import_playlist_url && importMode === 'url') {
      setImportMode('auth');
    } else if (!flags.feature_import_playlist_auth && importMode === 'auth') {
      setImportMode('url');
    }
  }, [flags.feature_import_playlist_url, flags.feature_import_playlist_auth, importMode]);

  if (!flags.feature_import_playlist) {
    return <FeatureDisabled />;
  }
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
        redirectTo: `${window.location.origin}/import/playlist`,
      },
    });

    if (error) {
      console.error('Gagal connect Spotify:', error);
      setErrorMessage(friendlyConnectError);
      setLoading(false);
    }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotifyUrl) {
      setErrorMessage('URL tidak boleh kosong.');
      return;
    }
    setErrorMessage('');
    setScrapedResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/import/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: spotifyUrl })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengambil data dari URL.');
      }

      setScrapedResult(data.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal scraping URL playlist. Pastikan playlist bersifat publik.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!user || !scrapedResult) return;
    await startImport(scrapedResult, user.id);
    setScrapedResult(null);
    setSpotifyUrl('');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-muted">Import</p>
        <h1 className="text-4xl font-display font-bold">Import Playlist</h1>
        <p className="mt-3 text-muted">
          Pilih metode import playlist dari Spotify ke library kamu.
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
        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="flex gap-4 border-b border-white/10 pb-4">
            {flags.feature_import_playlist_url && (
              <button
                onClick={() => setImportMode('url')}
                className={`pb-4 -mb-[17px] text-sm font-semibold transition-colors ${importMode === 'url' ? 'border-b-2 border-[#FA243C] text-white' : 'text-white/50 hover:text-white'}`}
              >
                Import playlist (Url)
              </button>
            )}
            {flags.feature_import_playlist_auth && (
              <button
                onClick={() => setImportMode('auth')}
                className={`pb-4 -mb-[17px] text-sm font-semibold transition-colors ${importMode === 'auth' ? 'border-b-2 border-[#FA243C] text-white' : 'text-white/50 hover:text-white'}`}
              >
                Spotify Auth
              </button>
            )}
          </div>

          {callbackMessage && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Gagal connect Spotify😓😓. Bantu support developer buat upgrade akun premium Spotify Developer.
            </div>
          )}

          {importMode === 'auth' && flags.feature_import_playlist_auth && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-white">Login akun Spotify kamu</p>
                <p className="text-xs text-muted mt-1">Mewajibkan akun Spotify Developer yang di-whitelist.</p>
              </div>
              <button
                type="button"
                onClick={handleConnectSpotify}
                disabled={loading}
                className="rounded-full bg-[#1DB954] px-5 py-2 text-xs font-bold tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-70 hover:bg-[#1ed760] transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect with Spotify'}
              </button>
            </div>
          )}

          {importMode === 'url' && flags.feature_import_playlist_url && (
            <div className="space-y-6">
              <form onSubmit={handleUrlImport} className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div>
                  <label className="text-sm font-semibold text-white">Link Playlist (Spotify, YouTube Music, Apple Music)</label>
                  <p className="text-xs text-muted mt-1 mb-3">Copy URL playlist publik lalu paste di sini.</p>
                  <input
                    type="text"
                    placeholder="Contoh: https://platform-music-kamu.com/playlist/... "
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#FA243C] focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !spotifyUrl}
                    className="rounded-full bg-[#FA243C] px-6 py-2.5 text-xs font-bold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#ff3b53] transition-colors"
                  >
                    {loading ? 'Scraping Playlist...' : 'Extract Playlist'}
                  </button>
                </div>
              </form>

              {scrapedResult && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-5 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-4">
                    {scrapedResult.coverUrl && (
                      <img src={scrapedResult.coverUrl} alt="Cover" className="w-20 h-20 rounded-xl object-cover" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{scrapedResult.name}</h3>
                      <p className="text-sm text-muted capitalize">Source: {scrapedResult.source} • {scrapedResult.tracks.length} Tracks</p>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                    {scrapedResult.tracks.map((track, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                        <div className="flex items-center gap-3 truncate">
                          <span className="text-xs text-muted w-4">{i + 1}</span>
                          <div className="truncate">
                            <p className="text-sm text-white truncate">{track.title}</p>
                            <p className="text-xs text-muted truncate">{track.artist}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <button
                      onClick={handleSaveToLibrary}
                      disabled={importProgress !== null}
                      className="w-full rounded-full bg-white text-black font-bold py-3 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importProgress !== null ? `Matching and Saving... ${importProgress}%` : 'Save to Library'}
                    </button>
                    {importProgress !== null && (
                      <div className="w-full bg-white/10 rounded-full h-2 mt-4 overflow-hidden">
                        <div
                          className="bg-[#FA243C] h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${importProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {!flags.feature_import_playlist_auth && !flags.feature_import_playlist_url && (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
              Semua metode import sedang dimatikan dari server.
            </div>
          )}

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
