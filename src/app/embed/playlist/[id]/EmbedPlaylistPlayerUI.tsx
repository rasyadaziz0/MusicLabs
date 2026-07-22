import Image from 'next/image';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { EmbedBrandLogo } from '../../_components/EmbedBrandLogo';
import { EmbedPromoModal } from '../../_components/EmbedPromoModal';
import { EmbedProgressBar } from '../../_components/EmbedProgressBar';
import { EmbedPreviewBadge } from '../../_components/EmbedPreviewBadge';
import { EmbedPlaylistPlayerState } from './EmbedPlaylistPlayerController';
import { EmbedPlaylistTrack } from '../../_components/types';

export interface EmbedPlaylistPlayerUIProps {
  playlistId: string;
  playlistName: string;
  coverUrl: string;
  tracks: EmbedPlaylistTrack[];
  isLoggedIn: boolean;
  state: EmbedPlaylistPlayerState;
  showPromo: boolean;
  setShowPromo: (show: boolean) => void;
  togglePlay: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  setTrack: (index: number) => void;
}

export function EmbedPlaylistPlayerUI({
  playlistId,
  playlistName,
  coverUrl,
  tracks,
  isLoggedIn,
  state,
  showPromo,
  setShowPromo,
  togglePlay,
  handleNext,
  handlePrev,
  handleSeek,
  setTrack,
}: EmbedPlaylistPlayerUIProps) {
  return (
    <div
      className="relative w-full h-full min-h-[380px] bg-[#f5f5f7] flex flex-col font-sans overflow-hidden text-[#1d1d1f]"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div id="embed-yt-player" className="hidden" />

      {/* Top Header */}
      <div className="flex justify-between items-center px-4 py-3 relative z-10 shrink-0">
        <EmbedBrandLogo />
        {!isLoggedIn && (
          <button
            onClick={() => setShowPromo(true)}
            className="bg-black/5 hover:bg-black/10 transition-colors px-3 py-1 rounded-full text-[11px] font-bold text-[#1d1d1f]"
          >
            Masuk
          </button>
        )}
      </div>

      {/* Player Area */}
      <div className="p-5 flex gap-5 items-center shrink-0">
        <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden shadow-sm bg-gray-200 border border-black/5 shrink-0">
          {coverUrl ? (
            <Image src={coverUrl} alt={playlistName} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Music size={40} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col pt-1">
          <span className="text-[10px] font-bold text-[#86868b] tracking-wider mb-1">PLAYLIST</span>
          <a
            href={`/playlist/${playlistId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[18px] leading-tight text-[#1d1d1f] hover:underline truncate mb-3"
            title={playlistName}
          >
            {playlistName}
          </a>

          <div className="mb-4 min-h-[36px]">
            <div className="font-semibold text-[14px] leading-tight text-[#1d1d1f] truncate">
              {state.currentTrack?.name}
            </div>
            <div className="text-[13px] text-[#86868b] truncate mt-0.5">
              {state.currentTrack?.artistName}
            </div>
          </div>

          <EmbedProgressBar
            currentTime={state.currentTime}
            duration={state.totalDuration}
            onSeek={handleSeek}
          />
        </div>
      </div>

      {/* Controls Area */}
      <div className="px-5 pb-4 flex items-center justify-between shrink-0 relative">
        {state.error ? (
          <div className="flex-1 text-center text-[12px] text-[#fa243c] font-medium px-4">
            {state.error}
          </div>
        ) : (
          <div className="flex-1 flex justify-center gap-6 items-center">
            <button
              onClick={handlePrev}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#1d1d1f] hover:bg-black/5 transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-[44px] h-[44px] flex items-center justify-center rounded-full bg-[#1d1d1f] hover:scale-105 active:scale-95 transition-all text-white shadow-sm"
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isLoading && !state.isPlaying ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : state.isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#1d1d1f] hover:bg-black/5 transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>
        )}
      </div>

      {/* Tracklist Area */}
      <div className="flex-1 overflow-y-auto border-t border-black/5 bg-white">
        {tracks.map((track, idx) => {
          const isCurrent = state.currentIndex === idx;
          return (
            <div
              key={track.id + idx}
              onClick={() => setTrack(idx)}
              className={`
                flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-black-[0.03] transition-colors
                ${isCurrent ? 'bg-[#fae5e5] hover:bg-[#f5d5d5]' : 'hover:bg-[#f5f5f7]'}
              `}
            >
              <div className="w-8 h-8 relative rounded-[4px] overflow-hidden shrink-0 bg-gray-100">
                <Image src={track.coverUrl || '/placeholder.png'} alt={track.name} fill className="object-cover" unoptimized />
                {isCurrent && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    {state.isPlaying ? (
                      <div className="flex gap-[2px] items-end h-3">
                        <div className="w-1 bg-white animate-[bounce_0.8s_infinite] rounded-[1px] h-3" />
                        <div className="w-1 bg-white animate-[bounce_0.8s_infinite_0.2s] rounded-[1px] h-2" />
                        <div className="w-1 bg-white animate-[bounce_0.8s_infinite_0.4s] rounded-[1px] h-3" />
                      </div>
                    ) : (
                      <Play size={12} fill="white" className="text-white ml-0.5" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-medium truncate ${isCurrent ? 'text-[#fa243c]' : 'text-[#1d1d1f]'}`}>
                  {track.name}
                </div>
                <div className={`text-[12px] truncate ${isCurrent ? 'text-[#fa243c]/80' : 'text-[#86868b]'}`}>
                  {track.artistName}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating preview badge */}
      <EmbedPreviewBadge isVisible={state.useNativePreview && state.isPlaying} className="top-14" />

      {/* Promo Modal */}
      <EmbedPromoModal isOpen={showPromo} onClose={() => setShowPromo(false)} />
    </div>
  );
}
