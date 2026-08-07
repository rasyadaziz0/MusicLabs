import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useImport } from '@/context/ImportContext';
import { ScrapedPlaylist } from '@/types/services/scrapers';
import { MusicApiService } from '@/lib/api/MusicApiService';

export function usePlaylistImport() {
  const { flags } = useFeatureFlags();
  const { user, signInWithGoogle } = useAuth();
  const { startImport, isImporting, importProgress } = useImport();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState<'auth' | 'url'>('url');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [scrapedResult, setScrapedResult] = useState<ScrapedPlaylist | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const callbackError = searchParams.get('error');
  const callbackErrorCode = searchParams.get('error_code');
  const callbackErrorDescription = searchParams.get('error_description');
  const callbackMessage = callbackError
    ? [callbackErrorCode, callbackErrorDescription].filter(Boolean).join(' - ')
    : '';

  // Sync mode if flags change
  useEffect(() => {
    if (!flags.feature_import_playlist_url && importMode === 'url') {
      setImportMode('auth');
    } else if (!flags.feature_import_playlist_auth && importMode === 'auth') {
      setImportMode('url');
    }
  }, [flags.feature_import_playlist_url, flags.feature_import_playlist_auth, importMode]);

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
      setErrorMessage('Gagal connect ke Spotify sekarang. Coba lagi beberapa saat lagi.');
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
      const data = await MusicApiService.apiFetchInternal<any>('/api/import/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: spotifyUrl })
      });
      setScrapedResult(data);
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

  return {
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
    handleConnectSpotify,
    handleUrlImport,
    handleSaveToLibrary
  };
}
