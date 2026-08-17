import { ScrapedPlaylist } from '@/types/services/scrapers';

export interface ImportContextType {
  isImporting: boolean;
  isCancelling: boolean;
  importProgress: number | null; // 0-100
  startImport: (scrapedResult: ScrapedPlaylist, userId: string) => Promise<void>;
  cancelImport: () => Promise<void>;
}
