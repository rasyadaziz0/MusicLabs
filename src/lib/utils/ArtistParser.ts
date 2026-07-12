import { Artist, ImageQuality } from '@/types/music';

export interface RawArtistInput {
  id?: string | null;
  name?: string | null;
  url?: string | null;
}

/**
 * OOP Utility Class to cleanly parse single or joint artist strings/arrays
 * into distinct Artist objects. Ensures UI elements always render separate,
 * individually clickable artist links.
 */
export class ArtistParser {
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
          } else if (defaultIdPrefix === 'itunes-artist' && !id.startsWith('itunes-artist-') && !id.startsWith('itunes-search-')) {
            id = `itunes-artist-${id}`;
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
        id = mainId.startsWith(defaultIdPrefix) || mainId.startsWith('itunes-') || mainId.startsWith('artist-')
          ? mainId
          : `${defaultIdPrefix}-${mainId}`;
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
