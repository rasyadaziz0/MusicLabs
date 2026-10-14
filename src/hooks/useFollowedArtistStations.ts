'use client';

import { useAuth } from '@/context/AuthContext';
import { MusicApiService } from '@/lib/api/MusicApiService';
import { ArtistFollowRepository } from '@/lib/supabase/repositories/ArtistFollowRepository';
import { ArtistStation } from '@/types/models/ArtistFollow';
import { useQuery } from '@tanstack/react-query';

function shuffleList<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useFollowedArtistStations(limit: number = 10) {
  const { user } = useAuth();
  const repo = ArtistFollowRepository.getInstance();

  return useQuery({
    queryKey: ['followed-artist-stations', user?.id, limit],
    queryFn: async (): Promise<ArtistStation[]> => {
      // Rule AUTH-02 / STA-01: User MUST be authenticated and have followed artists
      if (!user) return [];

      // 1. Fetch followed artists from Supabase
      const followedArtists = await repo.getFollowedArtists(limit);
      if (!followedArtists || followedArtists.length === 0) {
        return [];
      }

      // 2. Fetch station data for each followed artist in parallel
      const stationPromises = followedArtists.map(async (artist) => {
        try {
          const station = await MusicApiService.getArtistStation(artist.artistId);
          if (station && station.hasStation && station.tracks && station.tracks.length > 0) {
            // Ensure artist info is populated
            return {
              ...station,
              artist: {
                id: artist.artistId,
                name: station.artist?.name || artist.artistName,
                image: station.artist?.image || artist.artistImageUrl || null,
              },
            } as ArtistStation;
          }
          return null;
        } catch (err) {
          console.warn(`[useFollowedArtistStations] Failed to fetch station for ${artist.artistName}:`, err);
          return null;
        }
      });

      const results = await Promise.allSettled(stationPromises);
      const stations: ArtistStation[] = [];

      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          stations.push(res.value);
        }
      }

      // Rule HOM-06: Shuffle stations order for variety on each load
      return shuffleList(stations).slice(0, limit);
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000,
  });
}
