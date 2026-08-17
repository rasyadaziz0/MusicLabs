'use client';

import FeatureDisabled from '@/components/ui/FeatureDisabled';
import { usePlaylistImport } from '@/hooks/usePlaylistImport';
import ImportUrlForm from './components/ImportUrlForm';
import ScrapedResultPreview from './components/ScrapedResultPreview';
import SpotifyAuthConnect from './components/SpotifyAuthConnect';

export default function ImportPlaylistPage() {
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

  if (!flags.feature_import_playlist) {
    return <FeatureDisabled />;
  }

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
              
              {!scrapedResult && importProgress !== null && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-[#FA243C] animate-pulse"></div>
                      <h3 className="text-sm font-bold text-white">
                        {isCancelling ? 'Membatalkan import...' : 'Import sedang berjalan di latar belakang...'}
                      </h3>
                    </div>
                    <button
                      onClick={cancelImport}
                      disabled={isCancelling}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? 'Membatalkan...' : 'Batalkan'}
                    </button>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden relative">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out ${
                        isCancelling
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse'
                          : 'bg-gradient-to-r from-[#FA243C] to-red-500'
                      }`}
                      style={{ width: `${importProgress}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">{importProgress}%</span>
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
