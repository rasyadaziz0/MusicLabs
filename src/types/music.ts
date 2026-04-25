export interface Artist {
  id: string;
  name: string;
  role: string;
  type: string;
  image: ImageQuality[];
  url: string;
}

export interface ImageQuality {
  quality: string;
  url: string;
}

export interface DownloadUrl {
  quality: string;
  url: string;
}

export interface Song {
  id: string;
  name: string;
  type: string;
  year: string;
  releaseDate: string | null;
  duration: number;
  label: string;
  explicitContent: boolean;
  playCount: number;
  language: string;
  hasLyrics: boolean;
  lyricsId: string | null;
  url: string;
  copyright: string;
  album: { id: string; name: string; url: string };
  artists: {
    primary: Artist[];
    featured: Artist[];
    all: Artist[];
  };
  image: ImageQuality[];
  downloadUrl: DownloadUrl[];
  audioUrl?: string;        // Resolved YouTube audio URL (set lazily on play)
  deezerTrackId?: number;   // Original Deezer track ID for reference
  preview?: string;         // Deezer 30s preview URL
  youtubeId?: string;       // Resolved YouTube video ID
}

export interface Album {
  id: string;
  name: string;
  description: string;
  year: string;
  type: string;
  playCount: number;
  language: string;
  explicitContent: boolean;
  songCount: number;
  url: string;
  primaryArtists: Artist[];
  featuredArtists: Artist[];
  artists: Artist[];
  image: ImageQuality[];
  songs: Song[];
}

export interface HomeFeed {
  trending: {
    songs: Song[];
    albums: Album[];
  };
  albums: Album[];
  charts: any[];
  playlists: any[];
}
