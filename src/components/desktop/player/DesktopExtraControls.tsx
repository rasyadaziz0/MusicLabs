import React from 'react';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, MessageSquare, ListMusic, MoreHorizontal, Share, Link2 } from 'lucide-react';
import QueuePopup from '@/components/player/QueuePopup';
import TrackLikeButton from '@/components/ui/TrackLikeButton';
import AddToPlaylistButton from '@/components/ui/AddToPlaylistButton';
import AddToQueueButton from '@/components/ui/AddToQueueButton';

export interface DesktopExtraControlsProps {
  currentTrack: any;
  hasTrack: boolean;
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  isVolumeSliderOpen: boolean;
  setIsVolumeSliderOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
}

export default function DesktopExtraControls({
  currentTrack, hasTrack, volume, setVolume, isMuted,
  isVolumeSliderOpen, setIsVolumeSliderOpen,
  isQueueOpen, setIsQueueOpen, isLyricsOpen, setIsLyricsOpen
}: DesktopExtraControlsProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = () => {
    if (!currentTrack?.album?.id) return;
    navigator.clipboard.writeText(`${window.location.origin}/album/${currentTrack.album.id}`);
    alert('Album link copied to clipboard!');
    setIsMenuOpen(false);
  };

  const handleCopyLink = () => {
    if (!currentTrack) return;
    navigator.clipboard.writeText(`${window.location.origin}/search?q=${encodeURIComponent(currentTrack.name)}`);
    alert('Song search link copied!');
    setIsMenuOpen(false);
  };

  return (
    <div className="flex items-center gap-[18px]">
      {/* Icons container that fades out when volume slider opens */}
      <div className={cn(
        "flex items-center gap-[18px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isVolumeSliderOpen ? "opacity-0 pointer-events-none scale-95" : "opacity-100 scale-100"
      )}>
        <div className="relative flex items-center justify-center" ref={menuRef}>
          <button 
            onClick={() => {
              if (!hasTrack) return;
              setIsMenuOpen(!isMenuOpen);
            }}
            className={cn("transition-colors", hasTrack ? (isMenuOpen ? "text-white" : "text-white hover:text-white/80") : "text-white/15 pointer-events-none")}
          >
            <MoreHorizontal size={20} strokeWidth={2.5} />
          </button>

          {isMenuOpen && currentTrack && (
            <div className="absolute right-0 bottom-full mb-4 w-56 bg-[#252525] border border-white/5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50 py-1.5 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in">
              <AddToPlaylistButton track={currentTrack} asMenuItem />
              <div className="w-full">
                <AddToQueueButton track={currentTrack} showText />
              </div>
              
              <div className="h-px bg-white/5 my-1 mx-3" />
              
              <TrackLikeButton track={currentTrack} asMenuItem />
              
              <div className="h-px bg-white/5 my-1 mx-3" />
              
              <button onClick={handleShare} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between group">
                <span>Share</span>
                <Share size={15} className="text-white/40 group-hover:text-white/80 transition-colors" />
              </button>
              <button onClick={handleCopyLink} className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition-colors flex items-center justify-between group">
                <span>Copy Link</span>
                <Link2 size={15} className="text-white/40 group-hover:text-white/80 transition-colors" />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            if (!hasTrack) return;
            setIsLyricsOpen(!isLyricsOpen);
            if (!isLyricsOpen) setIsQueueOpen(false);
          }}
          className={cn("transition-colors", hasTrack ? (isLyricsOpen ? "text-[#ff3b30]" : "text-white hover:text-white/80") : "text-white/15 pointer-events-none")}
        >
          <MessageSquare size={18} strokeWidth={2.5} />
        </button>
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => {
              if (!hasTrack) return;
              setIsQueueOpen(!isQueueOpen);
              if (!isQueueOpen) setIsLyricsOpen(false);
            }}
            className={cn("transition-colors", hasTrack ? (isQueueOpen ? "text-[#ff3b30]" : "text-white hover:text-white/80") : "text-white/15 pointer-events-none")}
          >
            <ListMusic size={18} strokeWidth={2.5} />
          </button>
          <QueuePopup isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
        </div>
      </div>

      {/* Volume */}
      <div 
        className="relative flex items-center justify-end h-[32px] w-[18px]"
        onMouseEnter={() => setIsVolumeSliderOpen(true)}
        onMouseLeave={() => setIsVolumeSliderOpen(false)}
      >
        <div 
          className={cn(
            "absolute right-0 flex items-center h-[32px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-20",
            isVolumeSliderOpen ? "w-[120px]" : "w-[18px]"
          )}
        >
          {/* Slider Area */}
          <div 
            className="flex items-center justify-end overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: isVolumeSliderOpen ? '102px' : '0px' }}
          >
            <div 
              className={cn(
                "w-[102px] pr-3 transition-opacity duration-200",
                isVolumeSliderOpen ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"
              )}
            >
              <div className="w-full h-[4px] bg-white/20 rounded-full relative flex items-center group/vol">
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 hover:scale-y-150 transition-transform" />
                <div className="absolute left-0 h-full bg-white rounded-full pointer-events-none group-hover/vol:bg-white" style={{ width: `${volume * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Icon */}
          <button 
            onClick={() => setIsVolumeSliderOpen(!isVolumeSliderOpen)}
            className={cn(
              "transition-colors flex-shrink-0 flex items-center justify-center w-[18px] h-full",
              isVolumeSliderOpen ? "text-white" : "text-white/60 hover:text-white"
            )}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} strokeWidth={2.5} /> : <Volume2 size={18} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}
