'use client';

import Link from 'next/link';
import { Check, ListPlus, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Song } from '@/types/music';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useAddTrackToPlaylist, useLibraryPlaylists } from '@/hooks/useMusicLibrary';

interface AddToPlaylistButtonProps {
  track: Song;
  className?: string;
}

export default function AddToPlaylistButton({ track, className }: AddToPlaylistButtonProps) {
  const { user, signInWithGoogle } = useAuth();
  const { data: playlists = [], isLoading } = useLibraryPlaylists();
  const addMutation = useAddTrackToPlaylist();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = 260;

    setOpenUpward(spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow);
  }, [isOpen]);

  const handleButtonClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!user) {
      await signInWithGoogle();
      return;
    }

    setIsOpen((open) => !open);
  };

  const handleAdd = async (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    addMutation.mutate(
      { playlistId, trackId: track.id },
      {
        onSuccess: () => {
          setIsOpen(false);
          setTimeout(() => setSelectedPlaylistId(null), 1200);
        },
      }
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleButtonClick}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted transition-colors hover:text-white',
          className
        )}
        title="Add to playlist"
        aria-label="Add to playlist"
      >
        <ListPlus size={16} />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 z-30 w-72 rounded-2xl border border-white/10 bg-[#121212] p-3 shadow-2xl',
            openUpward ? 'bottom-11' : 'top-11'
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Add to playlist</p>
            <Link href="/playlist/create" className="text-xs text-primary hover:underline">
              New playlist
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : playlists.length > 0 ? (
            <div className="space-y-1">
              {playlists.map((playlist) => {
                const isSelected = selectedPlaylistId === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => handleAdd(playlist.id)}
                    disabled={addMutation.isPending}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{playlist.name}</p>
                      <p className="truncate text-xs text-muted">
                        {playlist.description || 'Personal playlist'}
                      </p>
                    </div>
                    {isSelected && <Check size={16} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center">
              <p className="text-sm text-muted">Belum ada playlist.</p>
              <Link href="/playlist/create" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                Buat playlist pertama
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
