import { UserProfile } from '@/types/profile';

export interface IProfileRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  getProfileByUsername(username: string): Promise<UserProfile | null>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
  searchUsers(query: string, limit?: number): Promise<UserProfile[]>;
}
