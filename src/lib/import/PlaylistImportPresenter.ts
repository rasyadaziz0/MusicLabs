export type SupportedPlatform = 'spotify' | 'apple' | 'youtube';

export interface PlatformInfo {
  id: SupportedPlatform;
  name: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  sampleUrl: string;
}

export class PlaylistImportPresenter {
  private static readonly PLATFORMS: Record<SupportedPlatform, PlatformInfo> = {
    spotify: {
      id: 'spotify',
      name: 'Spotify',
      badgeBg: 'bg-[#1DB954]/15',
      badgeText: 'text-[#1DB954]',
      borderColor: 'border-[#1DB954]/30',
      sampleUrl: 'https://open.spotify.com/playlist/...',
    },
    apple: {
      id: 'apple',
      name: 'Apple Music',
      badgeBg: 'bg-[#FC3C44]/15',
      badgeText: 'text-[#FC3C44]',
      borderColor: 'border-[#FC3C44]/30',
      sampleUrl: 'https://music.apple.com/.../playlist/...',
    },
    youtube: {
      id: 'youtube',
      name: 'YouTube Music',
      badgeBg: 'bg-[#FF0000]/15',
      badgeText: 'text-[#FF4444]',
      borderColor: 'border-[#FF0000]/30',
      sampleUrl: 'https://music.youtube.com/playlist?list=...',
    },
  };

  public static detectPlatform(url: string): PlatformInfo | null {
    if (!url) return null;
    const trimmed = url.trim().toLowerCase();
    if (trimmed.includes('spotify.com')) return this.PLATFORMS.spotify;
    if (trimmed.includes('apple.com') || trimmed.includes('music.apple.com')) return this.PLATFORMS.apple;
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) return this.PLATFORMS.youtube;
    return null;
  }

  public static getAllPlatforms(): PlatformInfo[] {
    return Object.values(this.PLATFORMS);
  }

  public static getMobileInstructions(): Array<{ step: number; title: string; desc: string }> {
    return [
      {
        step: 1,
        title: 'Buka App Streaming',
        desc: 'Buka Spotify, Apple Music, atau YouTube Music di HP-mu.',
      },
      {
        step: 2,
        title: 'Salin Tautan Playlist',
        desc: 'Buka playlist publik > tap ikon Bagikan (Share) > Salin Tautan (Copy Link).',
      },
      {
        step: 3,
        title: 'Tempel & Simpan',
        desc: 'Tempel tautan di form ini, lalu tap "Extract Playlist" dan simpan ke Library.',
      },
    ];
  }
}
