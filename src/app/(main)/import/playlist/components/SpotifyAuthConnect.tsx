
interface SpotifyAuthConnectProps {
  loading: boolean;
  onConnect: () => void;
}

export default function SpotifyAuthConnect({ loading, onConnect }: SpotifyAuthConnectProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-white">Login akun Spotify kamu</p>
        <p className="text-xs text-muted mt-1">Mewajibkan akun Spotify Developer yang di-whitelist.</p>
      </div>
      <button
        type="button"
        onClick={onConnect}
        disabled={loading}
        className="rounded-full bg-[#1DB954] px-5 py-2 text-xs font-bold tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-70 hover:bg-[#1ed760] transition-colors"
      >
        {loading ? 'Connecting...' : 'Connect with Spotify'}
      </button>
    </div>
  );
}
