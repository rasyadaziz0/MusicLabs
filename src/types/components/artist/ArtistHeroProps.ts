export interface ArtistHeroProps {
  name: string;
  heroImage: string | null;
  hasTracks: boolean;
  handlePlayAll: () => void;
}
