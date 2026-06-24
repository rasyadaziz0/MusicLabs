import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../client';

export class PresenceRepository {
  private static instance: PresenceRepository;
  private supabase: SupabaseClient;

  private constructor() {
    this.supabase = supabase;
  }

  public static getInstance(): PresenceRepository {
    if (!PresenceRepository.instance) {
      PresenceRepository.instance = new PresenceRepository();
    }
    return PresenceRepository.instance;
  }

  async upsertPresence(
    userId: string,
    trackId: string,
    trackName: string,
    artistName: string,
    coverUrl: string
  ): Promise<void> {
    try {
      await this.supabase.from('user_presence').upsert(
        {
          user_id: userId,
          track_id: trackId,
          track_name: trackName,
          artist_name: artistName,
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      // Silently fail — presence is non-critical
      console.warn('Failed to upsert presence:', err);
    }
  }

  async clearPresence(userId: string): Promise<void> {
    try {
      await this.supabase
        .from('user_presence')
        .update({
          track_id: null,
          track_name: null,
          artist_name: null,
          cover_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Failed to clear presence:', err);
    }
  }
}
