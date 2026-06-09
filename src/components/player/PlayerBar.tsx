'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGroup } from 'framer-motion';
import { Timer } from 'lucide-react';
import dynamic from 'next/dynamic';
import NowPlaying from './NowPlaying';
import LyricsSidebar from './LyricsSidebar';
import GuestGate from '@/components/auth/GuestGate';

const MobilePlayerBar = dynamic(() => import('@/components/mobile/player/MobilePlayerBar'), { ssr: false });
const DesktopPlayerBar = dynamic(() => import('@/components/desktop/player/DesktopPlayerBar'), { ssr: false });

export interface PlayerBarProps {
  isMobile?: boolean;
}

export default function PlayerBar({ isMobile }: PlayerBarProps) {
  const {
    currentTrack,
    isPlaying,
    isResolving,
    isPreview,
    isGuestPreview,
    isRadio,
    radioMeta,
    isError,
    togglePlay,
    nextTrack,
    prevTrack,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    isShuffled,
    repeatMode,
    toggleShuffle,
    cycleRepeatMode,
    sleepTimerEndTime
  } = usePlayer();

  const { user, signOut } = useAuth();
  const router = useRouter();

  const [isMuted, setIsMuted] = useState(false);
  const [isVolumeSliderOpen, setIsVolumeSliderOpen] = useState(false);
  const [isGuestGateOpen, setIsGuestGateOpen] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sleep Timer Countdown
  useEffect(() => {
    if (!sleepTimerEndTime) {
      setSleepRemaining(null);
      return;
    }
    const updateRemaining = () => {
      const rem = sleepTimerEndTime - Date.now();
      if (rem <= 0) {
        setSleepRemaining(null);
      } else {
        const mins = Math.floor(rem / 60000);
        const secs = Math.floor((rem % 60000) / 1000);
        setSleepRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEndTime]);

  // Automatically close sidebars when Now Playing is opened
  useEffect(() => {
    if (isNowPlayingOpen) {
      setIsLyricsOpen(false);
      setIsQueueOpen(false);
    }
  }, [isNowPlayingOpen]);

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

  const hasTrack = !!currentTrack;

  return (
    <LayoutGroup>
      {hasTrack && (
        <NowPlaying
          isOpen={isNowPlayingOpen}
          onClose={() => setIsNowPlayingOpen(false)}
          isMobile={isMobile}
        />
      )}
      {isError && (
        <div className="fixed bottom-[90px] md:bottom-[80px] left-1/2 -translate-x-1/2 bg-[#FA243C] text-white px-6 py-2.5 rounded-full shadow-[0_8px_30px_rgb(250,36,60,0.4)] text-sm font-semibold z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          Lagu tidak tersedia
        </div>
      )}

      {sleepRemaining && (
        <div className="fixed bottom-[90px] md:bottom-[80px] right-6 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.5)] text-xs font-mono text-white z-[100] animate-in slide-in-from-right-4 fade-in duration-300 flex items-center gap-2">
          <Timer size={14} className="text-[#FA243C]" />
          <span>{sleepRemaining}</span>
        </div>
      )}

      {isMobile ? (
        <MobilePlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isResolving={isResolving}
          isGuestPreview={isGuestPreview}
          isRadio={isRadio}
          radioMeta={radioMeta}
          togglePlay={togglePlay}
          nextTrack={nextTrack}
          setIsNowPlayingOpen={setIsNowPlayingOpen}
        />
      ) : (
        <DesktopPlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isResolving={isResolving}
          isGuestPreview={isGuestPreview}
          isRadio={isRadio}
          radioMeta={radioMeta}
          togglePlay={togglePlay}
          nextTrack={nextTrack}
          prevTrack={prevTrack}
          currentTime={currentTime}
          duration={duration}
          seek={seek}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          isVolumeSliderOpen={isVolumeSliderOpen}
          setIsVolumeSliderOpen={setIsVolumeSliderOpen}
          setIsGuestGateOpen={setIsGuestGateOpen}
          isNowPlayingOpen={isNowPlayingOpen}
          setIsNowPlayingOpen={setIsNowPlayingOpen}
          isShuffled={isShuffled}
          toggleShuffle={toggleShuffle}
          repeatMode={repeatMode}
          cycleRepeatMode={cycleRepeatMode}
          isQueueOpen={isQueueOpen}
          setIsQueueOpen={setIsQueueOpen}
          isLyricsOpen={isLyricsOpen}
          setIsLyricsOpen={setIsLyricsOpen}
        />
      )}

      {/* Lyrics Sidebar */}
      {hasTrack && (
        <LyricsSidebar
          isOpen={isLyricsOpen}
          onClose={() => setIsLyricsOpen(false)}
        />
      )}

      {/* Guest Gate Modal */}
      <GuestGate
        isOpen={isGuestGateOpen}
        onClose={() => setIsGuestGateOpen(false)}
        action="listen to full songs"
      />
    </LayoutGroup>
  );
}
