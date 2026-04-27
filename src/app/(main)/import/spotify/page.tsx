'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

type ImportedTrack = {
  name: string;
  artist: string;
  searchQuery: string;
};

type ImportResponse = {
  playlistName: string;
  tracks: ImportedTrack[];
};

export default function ImportSpotifyPage() {
  const { user, signInWithGoogle } = useAuth();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<ImportResponse | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!url.trim()) {
      setErrorMessage('URL playlist Spotify wajib diisi.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setResult(null);

      const response = await fetch('/api/import/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal import playlist.');
      }

      setResult(data as ImportResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal import playlist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-muted">Import</p>
        <h1 className="text-4xl font-display font-bold">Import Spotify Playlist</h1>
        <p className="mt-3 text-muted">
          Tempel link playlist Spotify, lalu sistem akan ngambil daftar lagu dari playlist kamu.
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
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8">
          <div>
            <label htmlFor="spotify-url" className="mb-2 block text-sm font-medium text-white">
              Link Playlist Spotify
            </label>
            <input
              id="spotify-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition-colors focus:border-primary/50"
            />
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isLoading ? 'Importing...' : 'Import Playlist'}
          </button>
        </form>
      )}

      {result && (
        <section className="rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">{result.playlistName}</h2>
              <p className="text-sm text-muted">{result.tracks.length} lagu berhasil diambil.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 text-muted">
                <tr>
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Artist</th>
                  <th className="px-3 py-2">Search Query</th>
                </tr>
              </thead>
              <tbody>
                {result.tracks.map((track, index) => (
                  <tr key={`${track.searchQuery}-${index}`} className="border-b border-white/5">
                    <td className="px-3 py-2 text-muted">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{track.name}</td>
                    <td className="px-3 py-2">{track.artist}</td>
                    <td className="px-3 py-2 text-muted">{track.searchQuery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
