import { type DominantColors } from '@/types/hooks/colors';

export interface ArtworkColorsContextType {
  colors: DominantColors | null;
  prevColors: DominantColors | null;
  isLoading: boolean;
}
