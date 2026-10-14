'use client';

import { FollowedArtistCard } from '@/components/library/FollowedArtistCard';
import { useAuth } from '@/context/AuthContext';
import { ArtistFollowRepository } from '@/lib/supabase/repositories/ArtistFollowRepository';
import { FollowedArtist } from '@/types/models/ArtistFollow';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import Link from 'next/link';

export function FollowedArtistsList() {
  const { user } = useAuth();
  const repo = ArtistFollowRepository.getInstance();

  const { data: followedArtists = [], isLoading } = useQuery<FollowedArtist[]>({
    queryKey: ['followed-artists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return repo.getFollowedArtists(100);
    },
    enabled: Boolean(user),
    staleTime: 2 * 60 * 1000,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={`skel-${i}`}
            className="h-52 rounded-2xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (followedArtists.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 mx-auto mb-3">
          <Users size={24} />
        </div>
        <h3 className="text-base font-semibold text-white">Belum mengikuti artis</h3>
        <p className="text-sm text-white/50 mt-1 max-w-sm mx-auto">
          Ikuti artis favorit kamu untuk mendengarkan stasiun musik otomatis langsung di halaman Home!
        </p>
        <Link
          href="/search"
          className="inline-block mt-4 px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
        >
          Cari Artis
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {followedArtists.map((artist) => (
        <FollowedArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}
