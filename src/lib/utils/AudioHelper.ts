import { Song } from '@/types/music';

export class AudioHelper {
  /** Get best available audio URL from downloadUrl array */
  static getBestAudioUrl(song: Song): string {
    // Kalau audioUrl sudah di-resolve sebelumnya, pakai itu
    if (song.audioUrl) return song.audioUrl;

    const urls = song.downloadUrl;
    if (!urls || urls.length === 0) return '';

    const preferred = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'];
    for (const quality of preferred) {
      const found = urls.find(u => u.quality === quality);
      if (found?.url) return found.url;
    }
    return urls[urls.length - 1]?.url ?? '';
  }
}
