import Image from 'next/image';
import { Music2, Play, Search } from 'lucide-react';
import { Song } from '@/types/music';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { IdentifyMode } from '@/hooks/useIdentifyController';

interface IdentifyResultsProps {
  mode: IdentifyMode;
  matchedSong: Song | null;
  speechResults: Song[];
  speechTranscript: string;
  onPlay: (song: Song) => void;
  onSearch: (title: string, artist: string) => void;
  onReset: () => void;
}

export function IdentifyResults({
  mode,
  matchedSong,
  speechResults,
  speechTranscript,
  onPlay,
  onSearch,
  onReset,
}: IdentifyResultsProps) {
  
  if (mode === 'audd' && matchedSong) {
    const isPlayable = !matchedSong.id.startsWith('audd-');

    return (
      <div className="flex flex-col items-center gap-4 text-center w-full max-w-sm identify-result-enter">
        <div className="w-8 h-8 sm:w-6 sm:h-6 rounded-full bg-green-500/20 flex items-center justify-center mb-1">
          <Music2 size={14} className="text-green-400" />
        </div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Match Found</p>

        <div
          onClick={() => isPlayable ? onPlay(matchedSong) : onSearch(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
          className="w-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-2xl p-4 sm:p-5 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
              {getBestImageUrl(matchedSong.image) ? (
                <Image
                  src={getBestImageUrl(matchedSong.image)!}
                  alt={matchedSong.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/40 to-[#1a1a1e]" />
              )}
              {isPlayable && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={24} className="text-white fill-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-bold text-white truncate text-base sm:text-lg">{matchedSong.name}</p>
              <p className="text-white/50 text-sm truncate mt-0.5">
                {matchedSong.artists.primary.map((a) => a.name).join(', ')}
              </p>
              {matchedSong.album?.name && (
                <p className="text-white/30 text-xs truncate mt-0.5">{matchedSong.album.name}</p>
              )}
            </div>
            {isPlayable ? (
              <Play size={20} className="text-[#FA243C] flex-shrink-0 group-hover:scale-110 transition-transform" />
            ) : (
              <Search size={20} className="text-[#FA243C] flex-shrink-0 group-hover:scale-110 transition-transform" />
            )}
          </div>
        </div>

        {/* For AudD-only matches, show a helpful search button */}
        {!isPlayable && (
          <button
            onClick={() => onSearch(matchedSong.name, matchedSong.artists.primary[0]?.name || '')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FA243C] text-white text-sm font-semibold hover:bg-[#FA243C]/90 transition-all shadow-lg shadow-[#FA243C]/20"
          >
            <Search size={14} />
            Search on AcadMusic
          </button>
        )}

        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-full border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-all mt-2"
        >
          Try Another
        </button>
      </div>
    );
  }

  if (mode === 'speech' && speechResults.length > 0) {
    return (
      <div className="w-full max-w-sm identify-result-enter">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider text-center mb-3">
          <Search size={12} className="inline mr-1" />
          Results for &ldquo;{speechTranscript}&rdquo;
        </p>
        <div className="space-y-2 max-h-[50dvh] sm:max-h-[280px] overflow-y-auto scrollbar-hide">
          {speechResults.map((song) => (
            <div
              key={song.id}
              onClick={() => onPlay(song)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04] cursor-pointer transition-all group"
            >
              <div className="relative w-12 h-12 sm:w-11 sm:h-11 rounded-lg overflow-hidden flex-shrink-0">
                {getBestImageUrl(song.image) ? (
                  <Image
                    src={getBestImageUrl(song.image)!}
                    alt={song.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/30 to-[#1a1a1e]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{song.name}</p>
                <p className="text-white/40 text-xs truncate">
                  {song.artists.primary.map((a) => a.name).join(', ')}
                </p>
              </div>
              <Play size={16} className="text-white/30 group-hover:text-[#FA243C] flex-shrink-0 transition-colors" />
            </div>
          ))}
        </div>
        <button
          onClick={onReset}
          className="w-full mt-4 px-6 py-3 rounded-full border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
