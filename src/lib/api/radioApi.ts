import { RadioStation, Song } from '@/types/music';

// Radio Browser API — we pick a random server from their DNS pool
const RADIO_BROWSER_BASE = 'https://de1.api.radio-browser.info';

/**
 * Search radio stations by country.
 * Results are sorted by votes (popularity) descending.
 */
export async function searchRadioStations(
  country: string = 'Indonesia',
  limit: number = 50,
  offset: number = 0,
): Promise<RadioStation[]> {
  const url = new URL(`${RADIO_BROWSER_BASE}/json/stations/search`);
  url.searchParams.set('country', country);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('order', 'votes');
  url.searchParams.set('reverse', 'true');
  url.searchParams.set('hidebroken', 'true');

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Radio Browser API error: ${res.status}`);
  return res.json();
}

/**
 * Search stations by a free-text query (name or tag).
 */
export async function searchRadioByName(
  query: string,
  limit: number = 30,
): Promise<RadioStation[]> {
  const url = new URL(`${RADIO_BROWSER_BASE}/json/stations/byname/${encodeURIComponent(query)}`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('order', 'votes');
  url.searchParams.set('reverse', 'true');
  url.searchParams.set('hidebroken', 'true');

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Radio Browser API error: ${res.status}`);
  return res.json();
}

/**
 * Search stations by tag.
 */
export async function searchRadioByTag(
  tag: string,
  limit: number = 30,
): Promise<RadioStation[]> {
  const url = new URL(`${RADIO_BROWSER_BASE}/json/stations/bytag/${encodeURIComponent(tag)}`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('order', 'votes');
  url.searchParams.set('reverse', 'true');
  url.searchParams.set('hidebroken', 'true');

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Radio Browser API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch top-voted stations globally.
 */
export async function getTopStations(limit: number = 50): Promise<RadioStation[]> {
  const url = new URL(`${RADIO_BROWSER_BASE}/json/stations/topvote/${limit}`);
  url.searchParams.set('hidebroken', 'true');

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Radio Browser API error: ${res.status}`);
  return res.json();
}

/**
 * Convert a RadioStation into our Song type so it plugs directly
 * into the existing PlayerContext / PlayerBar.
 */
export function radioStationToSong(station: RadioStation): Song {
  const streamUrl = station.url_resolved || station.url;
  return {
    id: `radio_${station.stationuuid}`,
    name: station.name,
    type: 'radio',
    year: '',
    releaseDate: null,
    duration: 0, // live stream — infinite
    label: '',
    explicitContent: false,
    playCount: station.clickcount,
    language: station.language || '',
    hasLyrics: false,
    lyricsId: null,
    url: station.homepage || streamUrl,
    copyright: '',
    album: { id: '', name: 'Live Radio', url: '' },
    artists: {
      primary: [{ id: '', name: station.name, role: 'station', type: 'station', image: [], url: '' }],
      featured: [],
      all: [],
    },
    image: station.favicon
      ? [
          { quality: '500x500', url: station.favicon },
          { quality: '150x150', url: station.favicon },
          { quality: '50x50', url: station.favicon },
        ]
      : [],
    downloadUrl: [],
    isRadio: true,
    radioStreamUrl: streamUrl,
    radioMeta: {
      title: 'Live Radio',
      station: station.name,
    },
  };
}
