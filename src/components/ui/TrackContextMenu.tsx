'use client';

import { useState, useEffect } from 'react';
import { Song } from '@/types/music';
import { PlaySquare, Heart, ListPlus, Disc3, Mic2, Share, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePlayer } from '@/context/PlayerContext';
import Image from 'next/image';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { useAuth } from '@/context/AuthContext';
import { useLikedSongsIndex, useToggleLikedSong } from '@/hooks/useMusicLibrary';
import toast from 'react-hot-toast';
import { resolveToYoutubeId } from '@/lib/youtube';
import { PlaylistSubMenu } from './context-menu/PlaylistSubMenu';
import { ContextMenu } from './context-menu/ContextMenu';
import { ContextMenuItem, ContextMenuDivider } from './context-menu/ContextMenuItem';

interface TrackContextMenuProps {
  track: Song | null;
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export function TrackContextMenu({ track, isOpen, position, onClose }: TrackContextMenuProps) {
  const router = useRouter();
  const { playNext, addToQueue, playTrack, isAutoplayEnabled, toggleAutoplay } = usePlayer();
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: track.name,
          text: `Check out ${track.name} by ${track.artists.primary[0]?.name}`,
          url: window.location.href, // or track.url
        });
      } catch (err) {
        // user cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
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

  const renderMenuItems = () => {
    if (showPlaylists) {
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
        <ContextMenuItem
          icon={<ListPlus size={15} />}
          label="Add to a Playlist"
          onClick={(e) => { e.stopPropagation(); setShowPlaylists(true); }}
        />
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
