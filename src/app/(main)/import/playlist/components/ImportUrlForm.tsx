import React from 'react';

interface ImportUrlFormProps {
  spotifyUrl: string;
  setSpotifyUrl: (url: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ImportUrlForm({ spotifyUrl, setSpotifyUrl, loading, onSubmit }: ImportUrlFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
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
  );
}
