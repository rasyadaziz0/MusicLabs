export interface IPresenceRepository {
  upsertPresence(
    userId: string,
    trackId: string,
    trackName: string,
    artistName: string,
    coverUrl: string
  ): Promise<void>;
  clearPresence(userId: string): Promise<void>;
}
