'use client';

import React, { useState } from 'react';
import { Clipboard, X, Loader2, Check } from 'lucide-react';

interface ImportUrlFormProps {
  spotifyUrl: string;
  setSpotifyUrl: (url: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ImportUrlForm({ spotifyUrl, setSpotifyUrl, loading, onSubmit }: ImportUrlFormProps) {
  const [pastedFeedback, setPastedFeedback] = useState(false);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setSpotifyUrl(text.trim());
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied', err);
    }
  };

  const handleClear = () => {
    setSpotifyUrl('');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="playlist-url" className="block text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2 ml-1">
          Link Playlist
        </label>
        
        <div className="relative flex items-center">
          <input
            id="playlist-url"
            type="text"
            placeholder="Tempel tautan Spotify, Apple Music, atau YouTube Music..."
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-3.5 pr-24 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#FA243C] focus:bg-white/10 transition-colors"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            {spotifyUrl ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-white/40 hover:text-white rounded-md transition-colors"
                title="Hapus"
              >
                <X size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition-colors"
                title="Tempel dari Clipboard"
              >
                {pastedFeedback ? <Check size={12} className="text-white" /> : <Clipboard size={12} />}
                <span>{pastedFeedback ? 'Ditempel!' : 'Tempel'}</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-[12px] text-white/40 mt-2 ml-1">
          Buka playlist di Spotify / Apple Music / YouTube Music &gt; Bagikan (Share) &gt; Salin Tautan (Copy Link).
        </p>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={loading || !spotifyUrl.trim()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#FA243C] text-white text-xs font-semibold hover:bg-[#FA243C]/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <span>Extract Playlist</span>
          )}
        </button>
      </div>
    </form>
  );
}
