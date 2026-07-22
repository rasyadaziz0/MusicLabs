'use client';

import { useState, useEffect } from 'react';
import { Song } from '@/types/music';
import { PlaySquare, Heart, ListPlus, Disc3, Mic2, Share, Radio, Link2, Timer, ChevronRight, Code } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { escapeHtmlAttr } from '@/lib/utils/escapeHtml';
import { usePlayer } from '@/context/PlayerContext';
import Image from 'next/image';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { useAuth } from '@/context/AuthContext';
import { useLikedSongsIndex, useToggleLikedSong } from '@/hooks/useMusicLibrary';
import { gooeyToast as toast } from 'goey-toast';
import { resolveToYoutubeId } from '@/lib/youtube';
import { buildTrackPath } from '@/lib/utils/slugify';
import { PlaylistSubMenu } from './context-menu/PlaylistSubMenu';
import { ContextMenu } from './context-menu/ContextMenu';
import { ContextMenuItem, ContextMenuDivider } from './context-menu/ContextMenuItem';
import { useIsMobile } from '@/hooks/useIsMobile';

interface TrackContextMenuProps {
  track: Song | null;
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  showPlayerControls?: boolean;
}

export function TrackContextMenu({ track, isOpen, position, onClose, showPlayerControls }: TrackContextMenuProps) {
  const router = useRouter();
  const { playNext, addToQueue, playTrack, isAutoplayEnabled, toggleAutoplay, setSleepTimer, clearSleepTimer, sleepTimerEndTime } = usePlayer();
  const { user, signInWithGoogle } = useAuth();

  // Likes
  const { likedSet } = useLikedSongsIndex();
  const toggleLikeMutation = useToggleLikedSong();
  const isLiked = track ? likedSet.has(track.id) : false;
  const [showPlaylists, setShowPlaylists] = useState(false);

  // Reset sub-menus when closed
  useEffect(() => {
    if (!isOpen) setShowPlaylists(false);
  }, [isOpen]);

  if (!track) return null;

  const handleAction = async (action: () => void | Promise<void>) => {
    await action();
    if (!showPlaylists) {
      onClose();
    }
  };

  const handleLike = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    toggleLikeMutation.mutate(track.id);
  };

  const getTrackUrl = () => {
    const artistName = track.artists?.primary?.[0]?.name || 'unknown';
    return `${window.location.origin}${buildTrackPath(artistName, track.name, track.id)}`;
  };

  const handleShare = async () => {
    const trackUrl = getTrackUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.name,
          text: `Check out ${track.name} by ${track.artists.primary[0]?.name}`,
          url: trackUrl,
        });
      } catch (err) {
        // user cancelled or error
      }
    } else {
      navigator.clipboard.writeText(trackUrl);
      toast.success('Link copied to clipboard', {
        description: 'You can now share this track anywhere.'
      });
    }
  };

  const handleCreateStation = async () => {
    toast.promise(
      (async () => {
        let videoId = track.id;
        // If it's a generic itunes or backend id without 'yt-', resolve it
        if (!videoId.startsWith('yt-')) {
          const resolved = await resolveToYoutubeId(track.name, track.artists.primary[0]?.name || '', track.id);
          if (resolved) videoId = resolved;
        } else {
          videoId = videoId.replace('yt-', '');
        }

        const titleParams = new URLSearchParams({
          title: track.name,
          artist: track.artists.primary[0]?.name || '',
          userId: user?.id || 'anonymous'
        });

        const res = await fetch(`/api/audio/related/${videoId}?${titleParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch station tracks');

        const data = await res.json();
        const suggestions: Song[] = data.songs || [];

        if (!suggestions || suggestions.length === 0) {
          throw new Error('No similar tracks found');
        }

        // Tag as autoplay so QueueManager handles them nicely
        const taggedSuggestions = suggestions.map(s => ({ ...s, isAutoplay: true }));

        playTrack(track, [track, ...taggedSuggestions]);

        if (!isAutoplayEnabled) {
          toggleAutoplay();
        }

        return 'Station created';
      })(),
      {
        loading: 'Creating station...',
        success: (msg) => msg,
        error: 'Failed to create station',
      }
    );
  };

  const hasAlbum = !!track.album.id;
  const hasArtist = track.artists.primary.length > 0 && !!track.artists.primary[0].id;

  const isMobile = useIsMobile();
  const flyOutDirection = position && typeof window !== 'undefined' && position.x > window.innerWidth / 2 ? 'left' : 'right';

  const renderMenuItems = () => {
    if (showPlaylists && isMobile) {
      return (
        <PlaylistSubMenu
          track={track}
          onClose={onClose}
          onBack={() => setShowPlaylists(false)}
        />
      );
    }

    return (
      <div className="py-1">
        <ContextMenuItem
          icon={<PlaySquare size={15} />}
          label="Play Next"
          onClick={() => handleAction(() => playNext(track))}
        />
        <ContextMenuItem
          icon={<ListPlus size={15} />}
          label="Play Last"
          onClick={() => handleAction(() => addToQueue(track))}
        />

        <ContextMenuDivider />

        <ContextMenuItem
          icon={<Heart size={15} fill={isLiked ? "currentColor" : "none"} />}
          label={isLiked ? 'Remove from Library' : 'Add to Library'}
          onClick={(e) => { e.stopPropagation(); handleLike(); onClose(); }}
          danger={isLiked}
        />

        <div
          className="relative"
          onMouseEnter={() => !isMobile && setShowPlaylists(true)}
          onMouseLeave={() => !isMobile && setShowPlaylists(false)}
        >
          <ContextMenuItem
            icon={<ListPlus size={15} />}
            label="Add to a Playlist"
            onClick={(e) => { e.stopPropagation(); if (isMobile) setShowPlaylists(true); }}
            rightElement={!isMobile && <ChevronRight size={14} />}
            className={!isMobile && showPlaylists ? "bg-white/10" : ""}
          />
          {!isMobile && showPlaylists && (
            <div
              className={`absolute top-0 ${flyOutDirection === 'left' ? 'right-full mr-1' : 'left-full ml-1'} w-56 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <PlaylistSubMenu
                track={track}
                onClose={onClose}
                onBack={() => setShowPlaylists(false)}
                hideHeader
              />
            </div>
          )}
        </div>

        <ContextMenuItem
          icon={<Radio size={15} />}
          label="Create Station"
          onClick={() => handleAction(handleCreateStation)}
        />

        <ContextMenuDivider />

        {hasAlbum && (
          <ContextMenuItem
            icon={<Disc3 size={15} />}
            label="Go to Album"
            onClick={() => handleAction(() => router.push(`/album/${track.album.id}`))}
          />
        )}
        {hasArtist && (
          <ContextMenuItem
            icon={<Mic2 size={15} />}
            label="Go to Artist"
            onClick={() => handleAction(() => router.push(`/artist/${track.artists.primary[0].id}`))}
          />
        )}

        <ContextMenuDivider />

        <ContextMenuItem
          icon={<Share size={15} />}
          label="Share"
          onClick={() => handleAction(handleShare)}
        />
        <ContextMenuItem
          icon={<Link2 size={15} />}
          label="Copy Link"
          onClick={() => {
            navigator.clipboard.writeText(getTrackUrl());
            toast.success('Link copied to clipboard');
            onClose();
          }}
        />
        <ContextMenuItem
          icon={<Code size={15} />}
          label="Copy Embed Code"
          onClick={() => {
            const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const escapedTitle = escapeHtmlAttr(track.name);
            const escapedArtist = track.artists?.primary?.[0]?.name ? escapeHtmlAttr(track.artists.primary[0].name) : '';
            const embedTitle = `${escapedTitle} — ${escapedArtist} | AcadMusic Embed`;
            const src = `${appUrl}/embed/track/${track.id}`;
            const iframe = `<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="175" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="${src}" title="${embedTitle}"></iframe>`;
            navigator.clipboard.writeText(iframe);
            toast.success('Embed code copied', { description: 'Paste into any website to embed this track.' });
            onClose();
          }}
        />

        {showPlayerControls && (
          <>
            <ContextMenuDivider />
            <div className="px-3 py-2">
              <div className="text-[12px] text-white/50 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Timer size={14} /> Sleep Timer
                </div>
                {sleepTimerEndTime && (
                  <span className="text-white/80 font-medium">Active</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      setSleepTimer(mins);
                      onClose();
                    }}
                    className="flex-1 text-[11px] bg-white/10 hover:bg-white/20 text-white px-1 py-1 rounded transition-colors text-center"
                  >
                    {mins}m
                  </button>
                ))}
                {sleepTimerEndTime && (
                  <button
                    onClick={() => {
                      clearSleepTimer();
                      onClose();
                    }}
                    className="w-full mt-1.5 text-[11px] bg-[#FA243C]/20 hover:bg-[#FA243C]/40 text-[#FA243C] py-1.5 rounded transition-colors"
                  >
                    Batalkan Timer
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const mobileHeader = (
    <div className="px-5 pb-4 pt-2 flex items-center gap-4 border-b border-white/10">
      <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
        {getBestImageUrl(track.image) && (
          <Image src={getBestImageUrl(track.image)!} alt={track.name} fill sizes="56px" className="object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-white truncate">{track.name}</h3>
        <p className="text-sm text-white/50 truncate">{track.artists.primary.map(a => a.name).join(', ')}</p>
      </div>
    </div>
  );

  return (
    <ContextMenu
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      mobileHeader={mobileHeader}
    >
      {renderMenuItems()}
    </ContextMenu>
  );
}
