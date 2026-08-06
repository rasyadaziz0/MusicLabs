export interface LyricsQuery {
  title: string;
  artist: string;
  album?: string;
  durationSec?: number | null;
}

export interface LyricsResult {
  synced: boolean;
  type: 'yrc' | 'lrc';
  lyrics: string;
  source: 'netease' | 'lrclib' | 'ovh';
}

/** Internal result returned by each provider */
export interface ProviderResult {
  synced: boolean;
  type: 'yrc' | 'lrc';
  lyrics: string;
  confidence: number;
  /** Optional plain-text fallback (e.g. LRCLib may return plain when no synced) */
  plainLyrics?: string;
  plainConfidence?: number;
}

/** Cleaned/preprocessed query passed to providers */
export interface CleanedQuery {
  cleanTitle: string;
  cleanArtist: string;
  primaryArtist: string;
  cleanAlbum: string;
  durationSec: number | null;
}
