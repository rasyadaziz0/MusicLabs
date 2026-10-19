import { IPresenceRepository } from '@/types/repositories/IPresenceRepository';
import { PresenceData } from '@/types/components/profile/PresenceData';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../client';

export class PresenceRepository implements IPresenceRepository {
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

  async getPresence(userId: string): Promise<PresenceData | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_presence')
        .select('track_id, track_name, artist_name, cover_url, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return data as PresenceData;
    } catch (err) {
      console.warn('Failed to get presence:', err);
      return null;
    }
  }

  subscribePresence(
    userId: string,
    onUpdate: (presence: PresenceData | null) => void
  ): () => void {
    const channel = this.supabase
      .channel(`presence_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE' || !payload.new?.track_id) {
            onUpdate(null);
          } else {
            onUpdate(payload.new as PresenceData);
          }
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}

