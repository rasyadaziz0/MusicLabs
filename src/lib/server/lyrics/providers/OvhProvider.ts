import { BaseLyricsProvider, CleanedQuery, ProviderResult } from './BaseLyricsProvider';

/**
 * OvhProvider — fetches plain-text lyrics from lyrics.ovh.
 *
 * This is the last-resort provider: it only returns unsynced plain text,
 * but has a broad catalog of Western/English songs.
 */
export class OvhProvider extends BaseLyricsProvider {
  readonly name = 'lyrics.ovh';
  readonly source = 'ovh' as const;

  async search(query: CleanedQuery): Promise<ProviderResult | null> {
    const { cleanTitle, cleanArtist, primaryArtist } = query;

    try {
      let url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`;
      let res = await fetch(url, { signal: this.timeoutSignal(10000), next: { revalidate: 86400 } });

      // Retry with primary artist
      if (!res.ok && primaryArtist !== cleanArtist) {
        url = `https://api.lyrics.ovh/v1/${encodeURIComponent(primaryArtist)}/${encodeURIComponent(cleanTitle)}`;
        res = await fetch(url, { signal: this.timeoutSignal(10000), next: { revalidate: 86400 } });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.lyrics) {
          return {
            synced: false,
            type: 'lrc',
            lyrics: data.lyrics,
            confidence: 50, // Plain text, no sync — moderate confidence
          };
        }
      }
    } catch (err: unknown) {
      this.logError('search', err);
    }
    return null;
  }
}
