import Image from 'next/image';
import { Play, Pause, MoreHorizontal, Music, Link as LinkIcon, Code, Maximize2 } from 'lucide-react';
import { EmbedBrandLogo } from '../../_components/EmbedBrandLogo';
import { EmbedPromoModal } from '../../_components/EmbedPromoModal';
import { EmbedProgressBar } from '../../_components/EmbedProgressBar';
import { EmbedPreviewBadge } from '../../_components/EmbedPreviewBadge';
import { EmbedPlayerState } from './EmbedPlayerController';

export interface EmbedTrackPlayerUIProps {
  trackId: string;
  trackName: string;
  artistName: string;
  coverUrl: string;
  isLoggedIn: boolean;
  state: EmbedPlayerState;
  hasStarted: boolean;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  showPromo: boolean;
  setShowPromo: (show: boolean) => void;
  togglePlay: () => void;
  handleSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  useNativePreview: boolean;
}

export function EmbedTrackPlayerUI({
  trackId,
  trackName,
  artistName,
  coverUrl,
  isLoggedIn,
  state,
  hasStarted,
  showMenu,
  setShowMenu,
  showPromo,
  setShowPromo,
  togglePlay,
  handleSeek,
  useNativePreview,
}: EmbedTrackPlayerUIProps) {
  return (
    <div
      className="relative w-screen h-screen bg-[#f5f5f7] overflow-hidden flex flex-col p-[14px] text-[#1d1d1f] border border-black/5 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] box-border"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div id="embed-yt-player" className="hidden" />

      {/* Top Bar: Logo & Login Button */}
      <div className="flex justify-between items-center h-[16px] mb-[8px] shrink-0">
        <EmbedBrandLogo />
        {!isLoggedIn && (
          <button
            onClick={() => setShowPromo(true)}
            className="bg-black/5 hover:bg-black/10 transition-colors px-[10px] py-[2px] rounded-full text-[10px] font-semibold text-[#1d1d1f]/70"
          >
            Masuk
          </button>
        )}
      </div>

      {state.error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-sm text-[#86868b] gap-2 text-center px-4">
          <p>{state.error}</p>
        </div>
      ) : (
        <div className="flex flex-row gap-[14px] items-start shrink-0">
          {/* Cover Art */}
          <div className="relative w-[100px] h-[100px] shrink-0 rounded-[8px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] bg-gray-200 border border-black/5">
            {coverUrl ? (
              <Image src={coverUrl} alt={trackName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Music size={28} />
              </div>
            )}
          </div>

          {/* Track Info & Controls */}
          <div className="flex-1 flex flex-col justify-start min-w-0 pt-0.5">
            {/* Header: Title, Artist, Options */}
            <div className="flex justify-between items-start relative">
              <div className="flex flex-col min-w-0 pr-2">
                <h3 className="font-semibold text-[15px] leading-tight text-[#1d1d1f] truncate">
                  {trackName}
                </h3>
                <p className="text-[13px] text-[#86868b] truncate mt-[3px]">
                  {artistName}
                </p>
              </div>
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-[26px] h-[26px] rounded-full bg-[#fa243c]/[0.08] text-[#fa243c] flex items-center justify-center hover:bg-[#fa243c]/[0.15] transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal size={15} strokeWidth={2.5} />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-[100] backdrop-blur-[6px] bg-black/[0.6]" onClick={() => setShowMenu(false)} />
                    <div
                      className="fixed w-[200px] bg-white/95 backdrop-blur-xl rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.12)] z-[101] py-[2px] border border-black/[0.08]"
                      style={{ top: 10, right: 10 }}
                    >
                      <a href={`/track/${trackId}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-[14px] py-[10px] hover:bg-black/[0.04] text-[13px] font-medium text-[#1d1d1f] no-underline">
                        Buka Lagu
                        <Maximize2 size={14} className="text-[#1d1d1f]/60" />
                      </a>
                      <button className="w-full flex items-center justify-between px-[14px] py-[10px] hover:bg-black/[0.04] text-[13px] font-medium text-[#1d1d1f]">
                        Salin Tautan ke Lagu
                        <LinkIcon size={14} className="text-[#1d1d1f]/60" />
                      </button>
                      <button className="w-full flex items-center justify-between px-[14px] py-[10px] hover:bg-black/[0.04] text-[13px] font-medium text-[#1d1d1f]">
                        Lekatkan Lagu
                        <Code size={14} className="text-[#1d1d1f]/60" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Playback Controls & Scrubber */}
            {!hasStarted ? (
              <div className="flex items-center gap-[8px] mt-[10px] w-full">
                <button
                  onClick={togglePlay}
                  className="bg-[#fa243c] text-white hover:bg-[#d91f33] transition-colors rounded-[6px] px-[14px] py-[6px] flex items-center justify-center gap-[4px] font-bold text-[12px]"
                >
                  <Play size={13} fill="currentColor" />
                  Putar
                </button>
                <a
                  href={`/track/${trackId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#fa243c]/[0.08] text-[#fa243c] hover:bg-[#fa243c]/[0.15] transition-colors rounded-[6px] px-[14px] py-[6px] font-bold text-[12px] no-underline flex items-center gap-[4px]"
                >
                  Lihat di AcadMusic
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-[10px] mt-[12px] w-full">
                <button
                  onClick={togglePlay}
                  disabled={state.isLoading && !state.isPlaying}
                  className="w-[24px] h-[24px] flex items-center justify-center bg-transparent shrink-0 text-[#1d1d1f]"
                >
                  {state.isLoading && !state.isPlaying ? (
                    <div className="w-[18px] h-[18px] border-[2px] border-[#1d1d1f]/20 border-t-[#1d1d1f] rounded-full animate-spin" />
                  ) : state.isPlaying ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>

                <EmbedProgressBar
                  currentTime={state.currentTime}
                  duration={state.totalDuration}
                  onSeek={handleSeek}
                />
              </div>
            )}

            {/* Disclaimer Text */}
            <div className="absolute bottom-2 right-[14px] text-[10px] text-[#86868b] pointer-events-none">
              Lihat bagaimana data Anda dikelola...
            </div>
          </div>
        </div>
      )}

      {/* Floating preview badge */}
      <EmbedPreviewBadge isVisible={useNativePreview && state.isPlaying} />

      {/* Promo Modal */}
      <EmbedPromoModal isOpen={showPromo} onClose={() => setShowPromo(false)} />
    </div>
  );
}
