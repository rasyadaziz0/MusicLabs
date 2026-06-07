import { notFound } from 'next/navigation';
import {
  getServerProfileByUsername,
  getServerCurrentUser,
  getServerPublicPlaylists,
  getServerFollowCounts,
  getServerIsFollowing,
  getServerUserPlaylists,
  getServerListeningStats,
  getServerLikedSongIds,
  getServerRecentTrackIds,
} from '@/lib/supabase/server-fetches';
import OtherProfile from '@/components/profile/OtherProfile';
import MyProfile from '@/components/profile/MyProfile';

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username: rawUsername } = await params;
  const decodedUsername = decodeURIComponent(rawUsername);

  // This route only handles @username paths
  if (!decodedUsername.startsWith('@')) {
    notFound();
  }

  const username = decodedUsername.substring(1); // remove the '@'

  // Fetch target profile and current user in parallel
  const [targetProfile, currentUser] = await Promise.all([
    getServerProfileByUsername(username),
    getServerCurrentUser(),
  ]);

  if (!targetProfile) {
    notFound();
  }

  const isOwnProfile = currentUser && currentUser.id === targetProfile.id;

  if (isOwnProfile) {
    // ── Own Profile: fetch all personal data server-side ──
    const [playlists, listeningStats, followCounts, likedSongIds, recentTrackIds] =
      await Promise.all([
        getServerUserPlaylists(currentUser.id),
        getServerListeningStats(currentUser.id),
        getServerFollowCounts(currentUser.id),
        getServerLikedSongIds(currentUser.id),
        getServerRecentTrackIds(currentUser.id),
      ]);

    return (
      <MyProfile
        initialData={{
          userId: currentUser.id,
          profile: targetProfile,
          playlists,
          likedSongIds,
          recentTrackIds,
          stats: {
            playlistCount: playlists.length,
            likedCount: likedSongIds.length,
            listenedCount: listeningStats.totalPlays,
            followerCount: followCounts.followers,
            followingCount: followCounts.following,
          },
        }}
      />
    );
  }

  // ── Other User's Profile: fetch public data server-side ──
  const [publicPlaylists, followCounts, isFollowing] = await Promise.all([
    getServerPublicPlaylists(targetProfile.id),
    getServerFollowCounts(targetProfile.id),
    currentUser
      ? getServerIsFollowing(currentUser.id, targetProfile.id)
      : Promise.resolve(false),
  ]);

  return (
    <OtherProfile
      initialData={{
        userId: targetProfile.id,
        profile: targetProfile,
        publicPlaylists,
        followerCount: followCounts.followers,
        followingCount: followCounts.following,
        isFollowing,
        isLoggedIn: Boolean(currentUser),
      }}
    />
  );
}
