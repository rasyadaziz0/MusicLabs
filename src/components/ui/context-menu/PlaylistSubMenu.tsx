import { X } from 'lucide-react';
import { Song } from '@/types/music';
import { useLibraryPlaylists, useAddTrackToPlaylist } from '@/hooks/useMusicLibrary';
import toast from 'react-hot-toast';

interface PlaylistSubMenuProps {
  track: Song;
  onClose: () => void;
  onBack: () => void;
}

export function PlaylistSubMenu({ track, onClose, onBack }: PlaylistSubMenuProps) {
  const { data: playlists = [] } = useLibraryPlaylists();
  const addPlaylistMutation = useAddTrackToPlaylist();

  const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
    addPlaylistMutation.mutate(
      { playlistId, trackId: track.id },
      {
        onSuccess: () => {
          toast.success(`Added to ${playlistName}`);
          onClose();
        },
      }
    );
  };

  return (
    <>
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
      <div className="max-h-48 overflow-y-auto custom-scrollbar">
        {playlists.length === 0 ? (
          <div className="px-4 py-3 text-sm text-white/50 text-center">No playlists found.</div>
        ) : (
          playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => handleAddToPlaylist(p.id, p.name)}
              className="w-full text-left px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 truncate"
            >
              {p.name}
            </button>
          ))
        )}
      </div>
    </>
  );
}
