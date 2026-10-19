import { PresenceData } from '@/types/components/profile/PresenceData';

export interface IPresenceRepository {
  upsertPresence(
    userId: string,
    trackId: string,
    trackName: string,
    artistName: string,
    coverUrl: string
  ): Promise<void>;
  clearPresence(userId: string): Promise<void>;
  getPresence(userId: string): Promise<PresenceData | null>;
  subscribePresence(
    userId: string,
    onUpdate: (presence: PresenceData | null) => void
  ): () => void;
}

