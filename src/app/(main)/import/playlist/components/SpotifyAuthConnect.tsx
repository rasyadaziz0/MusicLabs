'use client';

import { Loader2 } from 'lucide-react';

interface SpotifyAuthConnectProps {
  loading: boolean;
  onConnect: () => void;
}

export default function SpotifyAuthConnect({ loading, onConnect }: SpotifyAuthConnectProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 sm:p-5">
      <div>
        <p className="text-sm font-semibold text-white">Hubungkan Akun Spotify</p>
        <p className="text-xs text-white/50 mt-0.5">
          Khusus akun developer yang telah di-whitelist.
        </p>
      </div>
      <button
        type="button"
        onClick={onConnect}
        disabled={loading}
        className="w-full sm:w-auto rounded-lg bg-[#1DB954] px-5 py-2.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#1ed760] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Menghubungkan...</span>
          </>
        ) : (
          <span>Connect Spotify</span>
        )}
      </button>
    </div>
  );
}
