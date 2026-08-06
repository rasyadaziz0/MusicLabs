import { Song } from '@/types/music';

export interface AlbumPageClientProps {
  albumId: string;
  albumTitle: string;
  albumArtist: string;
  albumArtistId: string | null;
  coverUrl: string;
  releaseYear: string;
  trackCount: number;
  tracks: Song[];
}
