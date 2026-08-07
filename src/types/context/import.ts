import { ScrapedPlaylist } from '@/types/services/scrapers';

export interface ImportContextType {
  isImporting: boolean;
  importProgress: number | null; // 0-100
  startImport: (scrapedResult: ScrapedPlaylist, userId: string) => Promise<void>;
}
