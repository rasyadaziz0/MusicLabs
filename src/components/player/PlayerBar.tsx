'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import NowPlaying from './NowPlaying';
import LyricsSidebar from './LyricsSidebar';
import GuestGate from '@/components/auth/GuestGate';

const MobilePlayerBar = dynamic(() => import('@/components/mobile/player/MobilePlayerBar'));
const DesktopPlayerBar = dynamic(() => import('@/components/desktop/player/DesktopPlayerBar'));

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
    cycleRepeatMode
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <>
      {hasTrack && (
        <NowPlaying
          isOpen={isNowPlayingOpen}
          onClose={() => setIsNowPlayingOpen(false)}
          isMobile={isMobile}
        />
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
    </>
  );
}
