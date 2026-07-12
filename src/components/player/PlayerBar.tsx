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
import DeviceSidebar from './devices/DeviceSidebar';
import GuestGate from '@/components/auth/GuestGate';
import TapToStartOverlay from '@/components/player/TapToStartOverlay';
import { AnimatePresence } from 'framer-motion';
import { MobileAirPlayPopup } from '@/components/mobile/player/MobileAirPlayPopup';

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
  const [isDevicesOpen, setIsDevicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Automatically close sidebars when Now Playing is opened
  useEffect(() => {
    if (isNowPlayingOpen) {
      setIsLyricsOpen(false);
      setIsQueueOpen(false);
      setIsDevicesOpen(false);
    }
  }, [isNowPlayingOpen]);

  // Add body class to shift scroll arrows when right sidebar is open
  useEffect(() => {
    if (isLyricsOpen || isQueueOpen || isDevicesOpen) {
      document.body.classList.add('right-sidebar-open');
    } else {
      document.body.classList.remove('right-sidebar-open');
    }
    return () => document.body.classList.remove('right-sidebar-open');
  }, [isLyricsOpen, isQueueOpen, isDevicesOpen]);

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
          isDevicesOpen={isDevicesOpen}
          setIsDevicesOpen={setIsDevicesOpen}
        />
      )}
      {isError && (
        <div className="fixed bottom-[90px] md:bottom-[80px] left-1/2 -translate-x-1/2 bg-[#FA243C] text-white px-6 py-2.5 rounded-full shadow-[0_8px_30px_rgb(250,36,60,0.4)] text-sm font-semibold z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
          Lagu tidak tersedia
        </div>
      )}
      <TapToStartOverlay />


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
          isDevicesOpen={isDevicesOpen}
          setIsDevicesOpen={setIsDevicesOpen}
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
          isDevicesOpen={isDevicesOpen}
          setIsDevicesOpen={setIsDevicesOpen}
        />
      )}

      {/* Lyrics Sidebar */}
      {!isMobile && hasTrack && (
        <LyricsSidebar
          isOpen={isLyricsOpen}
          onClose={() => setIsLyricsOpen(false)}
        />
      )}

      {/* Devices Sidebar (Desktop) */}
      {!isMobile && (
        <DeviceSidebar
          isOpen={isDevicesOpen}
          onClose={() => setIsDevicesOpen(false)}
        />
      )}

      {/* Devices Popup (Mobile — from mini player bar) */}
      <AnimatePresence>
        {isMobile && isDevicesOpen && !isNowPlayingOpen && (
          <div
            key="mobile-device-overlay"
            onClick={() => setIsDevicesOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px]">
              <MobileAirPlayPopup onClose={() => setIsDevicesOpen(false)} />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest Gate Modal */}
      <GuestGate
        isOpen={isGuestGateOpen}
        onClose={() => setIsGuestGateOpen(false)}
        action="listen to full songs"
      />
    </LayoutGroup>
  );
}
