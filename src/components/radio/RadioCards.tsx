import { RadioStation } from '@/types/music';
import { Signal, Wifi, Play, Pause, Loader2, Globe, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NowPlayingRadioBanner({
  currentTrack,
  radioMeta,
  isPlaying,
  togglePlay,
}: {
  currentTrack: any;
  radioMeta: any;
  isPlaying: boolean;
  togglePlay: () => void;
}) {
  return (
    <section className="px-2">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FA243C]/15 via-[#FA243C]/5 to-transparent border border-[#FA243C]/20 p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FA243C]/10 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#FA243C]/20 flex items-center justify-center flex-shrink-0">
            {currentTrack.image?.[0]?.url ? (
              <img
                src={currentTrack.image[0].url}
                alt={currentTrack.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Signal size={24} className="text-[#FA243C] animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#FA243C] uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FA243C]" />
              </span>
              Now Playing
            </p>
            <p className="text-[16px] font-bold text-white truncate leading-snug">
              {radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
                ? radioMeta.title
                : currentTrack.name}
            </p>
            <p className="text-[13px] text-white/50 truncate">
              {radioMeta?.station || currentTrack.name}
              {radioMeta?.title && radioMeta.title !== 'Connecting...' && radioMeta.title !== 'Live Radio'
                ? ` • ${radioMeta.title}`
                : ''}
            </p>
          </div>
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
          >
            {isPlaying ? (
              <Pause size={20} fill="white" className="text-white" />
            ) : (
              <Play size={20} fill="white" className="text-white ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export function RadioStationCard({
  station,
  isPlaying,
  isResolving,
  isAudioPlaying,
  onPlay,
}: {
  station: RadioStation;
  isPlaying: boolean;
  isResolving: boolean;
  isAudioPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        'radio-card group relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
        isPlaying
          ? 'bg-[#FA243C]/10 border-[#FA243C]/30 ring-1 ring-[#FA243C]/20'
          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
      )}
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/5">
        {station.favicon ? (
          <img
            src={station.favicon}
            alt={station.name}
            className="absolute inset-0 w-full h-full object-cover z-[1]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <Radio size={20} className="text-white/20" />
        </div>
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
          isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {isPlaying && isResolving ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : isPlaying && isAudioPlaying ? (
            <Pause size={20} className="text-white" fill="white" />
          ) : (
            <Play size={18} className="text-white ml-0.5" fill="white" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[14px] font-semibold truncate leading-snug",
          isPlaying ? "text-[#FA243C]" : "text-white"
        )}>
          {station.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {station.bitrate > 0 && (
            <span className="text-[11px] text-white/30 font-medium">
              {station.bitrate} kbps
            </span>
          )}
          {station.codec && (
            <span className="text-[11px] text-white/30 font-medium uppercase">
              {station.codec}
            </span>
          )}
          {station.tags && (
            <span className="text-[11px] text-white/20 truncate max-w-[120px]">
              {station.tags.split(',').slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </div>
      {isPlaying && (
        <div className="flex-shrink-0 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FA243C] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FA243C]" />
          </span>
        </div>
      )}
    </button>
  );
}

export function RadioSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {[...Array(12)].map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="h-[80px] rounded-xl bg-white/5 animate-pulse"
        />
      ))}
    </div>
  );
}

export function RadioEmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Globe size={48} className="text-white/10 mb-4" />
      <p className="text-white/40 text-[15px]">
        {searchQuery ? 'No stations found for your search' : 'No stations available in this category'}
      </p>
    </div>
  );
}
