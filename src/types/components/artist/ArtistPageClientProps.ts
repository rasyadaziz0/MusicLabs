import { Song } from '@/types/music';
import { AlbumData } from '@/types/components/ui';

export interface ArtistPageClientProps {
  artistName: string;
  heroImage: string | null;
  topTracks: Song[];
  latestRelease: AlbumData | null;
  fullAlbums: AlbumData[];
  singlesEps: AlbumData[];
  allAlbums: AlbumData[];
}
