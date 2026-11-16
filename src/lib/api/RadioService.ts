import { RadioStation, Song } from '@/types/music';

export class RadioService {
  private static instance: RadioService;
  private cachedBaseUrl: string = '';

  private constructor() { }

  public static getInstance(): RadioService {
    if (!RadioService.instance) {
      RadioService.instance = new RadioService();
    }
    return RadioService.instance;
  }

  private getHeaders(): Record<string, string> {
    return {
      'User-Agent': 'MusicLabs/1.0',
      Accept: 'application/json',
    };
  }

  public async getBaseUrl(): Promise<string> {
    if (this.cachedBaseUrl) return this.cachedBaseUrl;
    try {
      const res = await fetch('https://all.api.radio-browser.info/json/servers', {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const servers = await res.json();
        if (Array.isArray(servers) && servers.length > 0) {
          const server = servers[Math.floor(Math.random() * servers.length)];
          this.cachedBaseUrl = `https://${server.name}`;
          return this.cachedBaseUrl;
        }
      }
    } catch {
    }
    this.cachedBaseUrl = 'https://de1.api.radio-browser.info';
    return this.cachedBaseUrl;
  }

  private async fetchStations(
    action: string,
    proxyParams: Record<string, string>,
    directPath: string,
    directParams: Record<string, string>
  ): Promise<RadioStation[]> {
    if (typeof window !== 'undefined') {
      try {
        const search = new URLSearchParams({ action, ...proxyParams }).toString();
        const res = await fetch(`/api/radio?${search}`);
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        }
      } catch (err) {
        console.warn(`RadioService: proxy fetch failed for action "${action}", falling back:`, err);
      }
    }

    try {
      const baseUrl = await this.getBaseUrl();
      const url = new URL(`${baseUrl}${directPath}`);
      Object.entries(directParams).forEach(([k, v]) => url.searchParams.set(k, v));

      const res = await fetch(url.toString(), {
        headers: this.getHeaders(),
        next: { revalidate: 600 },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error(`RadioService: direct fetch failed for "${directPath}":`, err);
      return [];
    }
  }

  public async searchRadioStations(
    countryCode: string = 'ID',
    limit: number = 50,
    offset: number = 0
  ): Promise<RadioStation[]> {
    return this.fetchStations(
      'search',
      { countrycode: countryCode, limit: String(limit), offset: String(offset) },
      '/json/stations/search',
      {
        countrycode: countryCode,
        limit: String(limit),
        offset: String(offset),
        order: 'votes',
        reverse: 'true',
        hidebroken: 'true',
      }
    );
  }
  public async searchRadioByName(
    query: string,
    limit: number = 30
  ): Promise<RadioStation[]> {
    return this.fetchStations(
      'byname',
      { query, limit: String(limit) },
      `/json/stations/byname/${encodeURIComponent(query)}`,
      {
        limit: String(limit),
        order: 'votes',
        reverse: 'true',
        hidebroken: 'true',
      }
    );
  }

  public async searchRadioByTag(
    tag: string,
    limit: number = 30
  ): Promise<RadioStation[]> {
    return this.fetchStations(
      'bytag',
      { tag, limit: String(limit) },
      `/json/stations/bytag/${encodeURIComponent(tag)}`,
      {
        limit: String(limit),
        order: 'votes',
        reverse: 'true',
        hidebroken: 'true',
      }
    );
  }

  public async getTopStations(limit: number = 50): Promise<RadioStation[]> {
    return this.fetchStations(
      'top',
      { limit: String(limit) },
      `/json/stations/topvote/${limit}`,
      { hidebroken: 'true' }
    );
  }

  public radioStationToSong(station: RadioStation): Song {
    const streamUrl = station.url_resolved || station.url;
    return {
      id: `radio_${station.stationuuid}`,
      name: station.name,
      type: 'radio',
      year: '',
      releaseDate: null,
      duration: 0,
      label: '',
      explicitContent: false,
      playCount: station.clickcount,
      language: station.language || '',
      hasLyrics: false,
      lyricsId: null,
      url: streamUrl,
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
}
