import {
    getPlaylistTracks
} from '@/lib/supabase/music';
import { useQuery } from '@tanstack/react-query';
// LOCAL IMPORTS

export function usePlaylistTracks(playlistId: string | null) {
  return useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: () => getPlaylistTracks(playlistId!),
    enabled: Boolean(playlistId),
  });
}

