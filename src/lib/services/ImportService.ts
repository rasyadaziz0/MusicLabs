import { supabase } from '@/lib/supabase/client';
import { PlaylistRepository } from '@/lib/supabase/repositories/PlaylistRepository';
import { ScrapedPlaylist } from '@/types/services/scrapers';
import { gooeyToast as toast } from 'goey-toast';

export class ImportService {
  private static instance: ImportService;

  private constructor() {}

  public static getInstance(): ImportService {
    if (!ImportService.instance) {
      ImportService.instance = new ImportService();
    }
    return ImportService.instance;
  }

  public async checkActiveJob(userId: string) {
    const { data, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
    return null;
  }

  public async startImport(scrapedResult: ScrapedPlaylist, userId: string): Promise<void> {
    try {
      const repo = new PlaylistRepository(supabase);
      
      // 1. Create Playlist (from frontend, so RLS uses the user's session)
      const newPlaylist = await repo.createPlaylist({
        userId,
        name: scrapedResult.name,
        coverUrl: scrapedResult.coverUrl,
      });

      // 2. Get user's access token for backend auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
      }

      // 3. Send tracks to backend for background processing
      const baseUrl = process.env.NEXT_PUBLIC_MUSIC_API_URL || process.env.NEXT_PUBLIC_YTMUSIC_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL || '';
      const res = await fetch(`${baseUrl}/api/import/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          playlistId: newPlaylist.id,
          tracks: scrapedResult.tracks,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memulai proses impor.');
      }

      toast.success(
        `Import "${scrapedResult.name}" (${scrapedResult.tracks.length} lagu) sedang diproses di latar belakang. Lagu akan muncul secara bertahap di playlist-mu.`
      );
    } catch (err: any) {
      console.error('Save to library error:', err);
      toast.error('Gagal menyimpan playlist ke library: ' + err.message);
      throw err;
    }
  }

  public async cancelImport(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
      }

      const baseUrl = process.env.NEXT_PUBLIC_MUSIC_API_URL || process.env.NEXT_PUBLIC_YTMUSIC_API_URL || process.env.NEXT_PUBLIC_EXPRESS_API_URL || '';
      const res = await fetch(`${baseUrl}/api/import/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal membatalkan import.');
      }
    } catch (err: any) {
      console.error('Cancel import error:', err);
      toast.error('Gagal membatalkan import: ' + err.message);
      throw err;
    }
  }
}
