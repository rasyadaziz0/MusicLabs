import { Artist, ImageQuality } from '@/types/music';
import { RawArtistInput } from '@/types/utils/artist';

export class ArtistParser {
  /**
   * Strips all known prefixes from an artist ID to get the raw numeric/channel ID
   * for backend API calls. Handles: itunes-artist-XXX, artist-XXX, itunes-search-XXX
   */
  public static stripArtistIdPrefix(rawId: string): string {
    return rawId
      .replace(/^itunes-artist-/, '')
      .replace(/^artist-/, '');
  }

  /**
   * Returns true if the artist ID is a search-based fallback (no real backend entity).
   * These IDs should trigger a name-based search instead of a direct API lookup.
   */
  public static isSearchBasedId(rawId: string): boolean {
    return rawId.startsWith('itunes-search-') || rawId.startsWith('search-');
  }

  /**
   * Returns true if the backend returned a dummy/empty artist (name equals raw ID, no picture).
   */
  public static isDummyArtist(artist: { name?: string; picture?: string; picture_xl?: string; nb_album?: number }, rawId: string): boolean {
    const strippedId = this.stripArtistIdPrefix(rawId);
    return (
      artist.name === strippedId ||
      artist.name === rawId ||
      (!artist.picture && !artist.picture_xl && artist.nb_album === 0)
    );
  }

  /**
   * Generates the correct URL for an artist page. If the ID is a YouTube channel ID
   * (which the iTunes backend cannot resolve), it generates a search-based URL containing the artist's name.
   */
  public static getArtistLink(artist: { id?: string; name?: string; title?: string }): string {
    const id = artist.id || '';
    let name = artist.name || artist.title || 'Unknown Artist';
    
    if ((id.startsWith('UC') && id.length >= 24) || id.startsWith('artist-UC')) {
      // If the name is combined (e.g. "Artist A, Artist B"), search for the first artist only
      name = name.split(/,|&| feat\. | ft\. /i)[0].trim();
      return `/artist/itunes-search-${encodeURIComponent(name)}`;
    }
    return `/artist/${id}`;
  }

  /**
   * Splits a raw artist string or array into multiple clean Artist objects.
   * Handles "Napking, Kaira Shashia", "Whisnu Santika & Adnan Veron", "Artist A feat. Artist B", etc.
   */
  public static parse(
    input: string | RawArtistInput[] | undefined | null,
    defaultIdPrefix: 'itunes-artist' | 'artist' = 'itunes-artist',
    mainId?: string | null,
    images: ImageQuality[] = []
  ): Artist[] {
    if (!input) {
      return [this.createUnknownArtist(defaultIdPrefix, images)];
    }

    // Case 1: Input is an array of raw artist objects (e.g. from YTMusic API)
    if (Array.isArray(input)) {
      const validArtists = input.filter(a => a && (a.name || a.id));
      if (validArtists.length > 0) {
        return validArtists.map((a, idx) => {
          const name = a.name ? a.name.trim() : 'Unknown Artist';
          let id = a.id;
          if (!id) {
            id = idx === 0 && mainId
              ? mainId
              : `${defaultIdPrefix === 'itunes-artist' ? 'itunes-' : ''}search-${encodeURIComponent(name)}`;
          } else if (defaultIdPrefix === 'itunes-artist') {
            // If the ID is a YouTube channel ID (starts with UC and typically 24 chars)
            // or we're forcing itunes, but it's not an itunes ID, we should fall back to a search ID
            // so that clicking the artist searches by name instead of 404ing on the iTunes backend.
            if ((id.startsWith('UC') && id.length === 24) || id.startsWith('artist-UC')) {
               id = `itunes-search-${encodeURIComponent(name)}`;
            } else if (!id.startsWith('itunes-artist-') && !id.startsWith('itunes-search-')) {
               id = `itunes-artist-${id}`;
            }
          }
          return {
            id,
            name,
            role: 'primary',
            type: 'artist',
            image: images,
            url: a.url || '',
          };
        });
      }
    }

    // Case 2: Input is a string (e.g. "Napking, Kaira Shashia")
    const rawString = typeof input === 'string' ? input : 'Unknown Artist';
    const names = rawString
      .split(/,\s*|\s+&\s+|\s+feat\.?\s+|\s+ft\.?\s+/i)
      .map(n => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      return [this.createUnknownArtist(defaultIdPrefix, images)];
    }

    return names.map((name, idx) => {
      let id: string;
      if (idx === 0 && mainId) {
        // If mainId is a YouTube ID but we are in itunes mode, convert to search ID
        if (defaultIdPrefix === 'itunes-artist' && ((mainId.startsWith('UC') && mainId.length === 24) || mainId.startsWith('artist-UC'))) {
          id = `itunes-search-${encodeURIComponent(name)}`;
        } else {
          id = mainId.startsWith(defaultIdPrefix) || mainId.startsWith('itunes-') || mainId.startsWith('artist-')
            ? mainId
            : `${defaultIdPrefix}-${mainId}`;
        }
      } else {
        id = `${defaultIdPrefix === 'itunes-artist' ? 'itunes-' : ''}search-${encodeURIComponent(name)}`;
      }

      return {
        id,
        name,
        role: 'primary',
        type: 'artist',
        image: images,
        url: '',
      };
    });
  }

  private static createUnknownArtist(prefix: string, images: ImageQuality[]): Artist {
    return {
      id: `${prefix}-unknown`,
      name: 'Unknown Artist',
      role: 'primary',
      type: 'artist',
      image: images,
      url: '',
    };
  }
}
