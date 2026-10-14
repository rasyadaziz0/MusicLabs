'use client';

import { usePlaylistImport } from '@/hooks/usePlaylistImport';
import ImportUrlForm from '@/app/(main)/import/playlist/components/ImportUrlForm';
import ScrapedResultPreview from '@/app/(main)/import/playlist/components/ScrapedResultPreview';
import SpotifyAuthConnect from '@/app/(main)/import/playlist/components/SpotifyAuthConnect';
import { AlertCircle, Music } from 'lucide-react';

export default function PlaylistImporter() {
  const {
    user,
    signInWithGoogle,
    flags,
    importMode,
    setImportMode,
    loading,
    spotifyUrl,
    setSpotifyUrl,
    scrapedResult,
    errorMessage,
    callbackMessage,
    importProgress,
    cancelImport,
    isCancelling,
    handleConnectSpotify,
    handleUrlImport,
    handleSaveToLibrary
  } = usePlaylistImport();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 bg-[#1c1c1e] rounded-xl border border-white/5 p-6">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <Music size={32} className="text-[#FA243C]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Login untuk Import Playlist</h2>
        <p className="text-white/60 text-[14px] max-w-sm mb-6">
          Masuk dengan Google agar playlist hasil impor langsung tersimpan di akun kamu.
        </p>
        <button
          type="button"
          onClick={() => signInWithGoogle('/playlist/create?tab=import')}
          className="px-6 py-2.5 rounded-lg bg-[#FA243C] text-white text-[14px] font-semibold hover:bg-[#FA243C]/90 transition-colors"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1c1c1e] border border-white/5 rounded-xl p-5 sm:p-7 space-y-6">
      {/* Sub Tabs: URL vs Spotify Auth */}
      {(flags.feature_import_playlist_url && flags.feature_import_playlist_auth) && (
        <div className="flex p-1 rounded-lg bg-white/5 border border-white/5">
          <button
            type="button"
            onClick={() => setImportMode('url')}
            className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              importMode === 'url'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Import via Link (URL)
          </button>
          <button
            type="button"
            onClick={() => setImportMode('auth')}
            className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              importMode === 'auth'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-white/50 hover:text-white'
            }`}
          >
            Spotify Connect
          </button>
        </div>
      )}

      {callbackMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs sm:text-sm text-red-200">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
          <span>Gagal menghubungkan Spotify. Pastikan akun kamu terdaftar pada whitelist Spotify Developer.</span>
        </div>
      )}

      {importMode === 'auth' && flags.feature_import_playlist_auth && (
        <SpotifyAuthConnect loading={loading} onConnect={handleConnectSpotify} />
      )}

      {importMode === 'url' && flags.feature_import_playlist_url && (
        <div className="space-y-6">
          <ImportUrlForm
            spotifyUrl={spotifyUrl}
            setSpotifyUrl={setSpotifyUrl}
            loading={loading}
            onSubmit={handleUrlImport}
          />

          {scrapedResult && (
            <ScrapedResultPreview
              scrapedResult={scrapedResult}
              importProgress={importProgress}
              onSave={handleSaveToLibrary}
            />
          )}

          {/* Background Running Job Card (Simple Dark) */}
          {!scrapedResult && importProgress !== null && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-[#FA243C] shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-white truncate">
                    {isCancelling ? 'Membatalkan import...' : 'Import sedang diproses di latar belakang...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={cancelImport}
                  disabled={isCancelling}
                  className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
                >
                  {isCancelling ? 'Membatalkan...' : 'Batalkan'}
                </button>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden relative">
                <div
                  className="h-2 rounded-full bg-[#FA243C] transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-white/40 text-right">{importProgress}% selesai</p>
            </div>
          )}
        </div>
      )}

      {!flags.feature_import_playlist_auth && !flags.feature_import_playlist_url && (
        <div className="rounded-lg border border-white/5 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
          Semua metode import sedang dinonaktifkan sementara.
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs sm:text-sm text-red-200">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
