import { Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Song } from '@/types/music';
import { useLibraryPlaylists, useAddTrackToPlaylist } from '@/hooks/useMusicLibrary';
import { gooeyToast as toast } from 'goey-toast';

interface PlaylistSubMenuProps {
  track: Song;
  onClose: () => void;
  onBack: () => void;
  hideHeader?: boolean;
}

export function PlaylistSubMenu({ track, onClose, onBack, hideHeader }: PlaylistSubMenuProps) {
  const { data: playlists = [] } = useLibraryPlaylists();
  const addPlaylistMutation = useAddTrackToPlaylist();

  const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
    addPlaylistMutation.mutate(
      { playlistId, trackId: track.id },
      {
        onSuccess: (status) => {
          if (status === 'ALREADY_EXISTS') {
            toast('Already in Playlist', {
              description: `This track is already in ${playlistName}.`
            });
          } else {
            toast.success(`Added to ${playlistName}`);
          }
          onClose();
        },
      }
    );
  };

  return (
    <>
      {!hideHeader && (
        <div className="px-4 py-2 flex items-center justify-between border-b border-white/10 mb-2">
          <span className="text-sm font-semibold text-white/50 uppercase">Add to Playlist</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="p-1 hover:bg-white/10 rounded-full"
          >
            <X size={14} className="text-white/60" />
          </button>
        </div>
      )}
      
      {hideHeader && (
        <div className="px-4 py-2 border-b border-white/5 flex items-center mb-1">
          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Add to Playlist</span>
        </div>
      )}

      <Link 
        href="/playlist/create" 
        onClick={onClose}
        className="group mb-1 mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-white transition-colors hover:bg-white/10"
      >
        <Plus size={16} className="text-[#FA243C]" />
        <span>New Playlist</span>
      </Link>

      <div className="my-1 mx-2 h-px bg-white/5" />

      <div className="max-h-48 overflow-y-auto custom-scrollbar">
        {playlists.length === 0 ? (
          <div className="px-4 py-3 text-sm text-white/50 text-center">No playlists found.</div>
        ) : (
          playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => handleAddToPlaylist(p.id, p.name)}
              className="w-full text-left px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/10 truncate rounded-lg mx-2"
              style={{ width: 'calc(100% - 16px)' }}
            >
              {p.name}
            </button>
          ))
        )}
      </div>
    </>
  );
}
