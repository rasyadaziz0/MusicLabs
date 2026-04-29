'use client';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { formatTime, cn } from '@/lib/utils';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Mic2,
  ListMusic,
  Maximize2,
  Loader2,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NowPlaying from './NowPlaying';
import TrackLikeButton from '@/components/library/TrackLikeButton';
import AddToPlaylistButton from '@/components/library/AddToPlaylistButton';

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    isResolving,
    isPreview,
    togglePlay,
    nextTrack,
    prevTrack,
    currentTime,
    duration,
    seek,
    volume,
    setVolume
  } = usePlayer();

  const { user, signOut } = useAuth();
  const router = useRouter();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const avatarUrlRaw = user?.user_metadata?.avatar_url as string | undefined;
  const avatarUrl = avatarUrlRaw?.trim().replace(/^`+|`+$/g, '');

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
        />
      )}

      {/* ───── Mobile Mini Player (bottom) ───── */}
      {hasTrack && !isNowPlayingOpen && (
        <div
          className="md:hidden fixed bottom-[104px] left-4 right-4 h-[60px] bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center px-3 gap-3 z-40 cursor-pointer"
          onClick={() => setIsNowPlayingOpen(true)}
        >
          <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
            {getBestImageUrl(currentTrack.image) ? (
              <Image
                src={getBestImageUrl(currentTrack.image)!}
                alt={currentTrack.name}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/40 to-void" />
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
            <p className="text-[9px] text-white/60 font-medium uppercase tracking-wider mb-0.5">
              iPhone → System Capture
            </p>
            <p className="text-[15px] font-bold truncate text-white leading-tight">
              {currentTrack.name}
            </p>
          </div>
          <div className="flex items-center gap-4 pl-2 text-white pr-2">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              disabled={isResolving}
              className="hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isResolving ? (
                <Loader2 size={24} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextTrack(); }}
              className="hover:scale-105 transition-transform"
            >
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      {/* ───── Desktop Top Header Bar (Apple Music macOS — always visible) ───── */}
      <div
        className={cn(
          "hidden md:flex flex-col bg-black/70 backdrop-blur-2xl backdrop-saturate-[180%] border-b border-white/[0.06] relative z-50",
          isNowPlayingOpen && "md:hidden"
        )}
      >
        {/* Main bar content — single row */}
        <div className="flex items-center h-[64px] px-5">

          {/* LEFT — Playback Controls */}
          <div className="flex items-center gap-4 w-[220px] min-w-[180px]">
            <button className={cn("transition-colors", hasTrack ? "text-white/40 hover:text-white/70" : "text-white/15 cursor-default")}>
              <Shuffle size={16} />
            </button>
            <button
              onClick={hasTrack ? prevTrack : undefined}
              className={cn("transition-colors", hasTrack ? "text-white/60 hover:text-white" : "text-white/15 cursor-default")}
            >
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button
              onClick={hasTrack ? togglePlay : undefined}
              disabled={hasTrack ? isResolving : true}
              className={cn("transition-colors disabled:opacity-50", hasTrack ? "text-white/90 hover:text-white" : "text-white/15 cursor-default")}
            >
              {isResolving ? (
                <Loader2 size={28} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <button
              onClick={hasTrack ? nextTrack : undefined}
              className={cn("transition-colors", hasTrack ? "text-white/60 hover:text-white" : "text-white/15 cursor-default")}
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
            <button className={cn("transition-colors", hasTrack ? "text-white/40 hover:text-white/70" : "text-white/15 cursor-default")}>
              <Repeat size={16} />
            </button>
          </div>

          {/* CENTER — Track Info with integrated progress (Apple Music style) */}
          <div className="flex-1 flex items-center justify-center">
            {hasTrack ? (
              <div
                className="flex flex-col bg-white/[0.06] rounded-lg cursor-pointer group hover:bg-white/[0.09] transition-colors max-w-[520px] w-full overflow-hidden"
                onClick={() => setIsNowPlayingOpen(true)}
              >
                {/* Top row: art + time + title + time + actions */}
                <div className="flex items-center gap-3 px-3 py-1.5">
                  {/* Album art */}
                  <div className="relative w-[38px] h-[38px] rounded-[5px] overflow-hidden flex-shrink-0">
                    {getBestImageUrl(currentTrack.image) ? (
                      <Image
                        src={getBestImageUrl(currentTrack.image)!}
                        alt={currentTrack.name}
                        fill
                        sizes="38px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
                    )}
                  </div>
                  {/* Elapsed time */}
                  <span className="text-[10px] text-white/30 font-mono tabular-nums flex-shrink-0 w-8 text-right">
                    {formatTime(currentTime)}
                  </span>
                  {/* Title & Artist */}
                  <div className="flex-1 min-w-0 overflow-hidden text-center">
                    <p className="text-[13px] font-semibold text-white/90 truncate leading-tight flex items-center justify-center gap-1.5">
                      {currentTrack.name}
                      {isPreview && (
                        <span className="px-1 py-0.5 rounded text-[7px] font-bold bg-white/10 text-muted uppercase tracking-wider border border-white/5 flex-shrink-0">
                          30s
                        </span>
                      )}
                    </p>
                    <div className="text-[11px] text-white/35 truncate leading-tight flex items-center justify-center gap-1">
                      {currentTrack.artists.primary.map((a, i) => (
                        <span key={a.id}>
                          <Link
                            href={`/artist/${a.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline hover:text-white/60 transition-colors"
                          >
                            {a.name}
                          </Link>
                          {i < currentTrack.artists.primary.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Remaining time */}
                  <span className="text-[10px] text-white/30 font-mono tabular-nums flex-shrink-0 w-8">
                    -{formatTime(Math.max(0, duration - currentTime))}
                  </span>
                  {/* Like & Add buttons */}
                  <div
                    className="hidden items-center gap-0.5 xl:flex"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <TrackLikeButton track={currentTrack} />
                    <AddToPlaylistButton track={currentTrack} />
                  </div>
                </div>
                {/* Progress bar — thin line at bottom of the pill */}
                <div
                  className="w-full h-[2px] bg-white/[0.04] relative group/progress cursor-pointer hover:h-[4px] transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute h-full bg-white/50 rounded-r-full transition-colors group-hover/progress:bg-primary"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Empty center pill when no track */
              <div className="bg-white/[0.04] rounded-lg px-4 py-5 max-w-[520px] w-full" />
            )}
          </div>

          {/* RIGHT — Volume + Extras + User Auth */}
          <div className="flex items-center justify-end gap-3 w-[260px] min-w-[200px]">
            {/* Volume slider */}
            <div className={cn("flex items-center gap-1.5 w-24 group/vol", !hasTrack && "opacity-30 pointer-events-none")}>
              <button onClick={toggleMute} className="text-white/40 hover:text-white/70 transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <div className="flex-1 h-[3px] bg-white/[0.08] rounded-full relative group-hover/vol:h-[5px] transition-all duration-200">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute h-full bg-white/70 rounded-full group-hover/vol:bg-white transition-colors"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>

            {/* Extra icons */}
            <div className={cn("flex items-center gap-0.5", !hasTrack && "opacity-20 pointer-events-none")}>
              <button
                onClick={() => setIsNowPlayingOpen(true)}
                className="text-white/30 hover:text-white/60 transition-colors p-1"
              >
                <Mic2 size={14} />
              </button>
              <button className="text-white/30 hover:text-white/60 transition-colors p-1">
                <ListMusic size={14} />
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/[0.08]" />

            {/* User Auth — Sign In or Avatar with Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="relative w-[34px] h-[34px] rounded-full overflow-hidden border-2 border-transparent hover:border-primary/50 transition-colors flex-shrink-0"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={user.user_metadata?.name || 'User'}
                      fill
                      sizes="34px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center">
                      <UserIcon size={16} className="text-white" />
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-[#2a2a2a] rounded-lg border border-white/10 shadow-2xl shadow-black/60 overflow-hidden z-[100]">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-[13px] font-semibold text-white truncate">
                        {user.user_metadata?.name || 'User'}
                      </p>
                      <p className="text-[11px] text-white/40 truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-white/70 hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                    >
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-5 py-2 bg-primary text-white text-[13px] font-bold rounded-full hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
