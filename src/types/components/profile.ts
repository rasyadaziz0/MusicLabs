import { PlaylistRecord } from '@/types/models/Playlist';
import { UserProfile } from '@/types/profile';

export interface MyProfileInitialData {
  userId: string;
  profile: UserProfile;
  playlists: PlaylistRecord[];
  likedSongIds: string[];
  recentTrackIds: string[];
  stats: {
    playlistCount: number;
    likedCount: number;
    listenedCount: number;
    followerCount: number;
    followingCount: number;
  };
}

export interface OtherProfileInitialData {
  userId: string;
  profile: UserProfile;
  publicPlaylists: PlaylistRecord[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isLoggedIn: boolean;
}
