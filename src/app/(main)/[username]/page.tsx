import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
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
import PrivateProfileView from '@/components/profile/PrivateProfileView';

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

  // Detect mobile
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);


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
        isMobile={isMobile}
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

  // ── Private Profile Guard ──
  if (!targetProfile.is_public) {
    return (
      <PrivateProfileView
        profile={targetProfile}
        isLoggedIn={Boolean(currentUser)}
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
      isMobile={isMobile}
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
