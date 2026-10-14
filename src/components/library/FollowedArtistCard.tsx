'use client';

import { FollowButton } from '@/components/artist/FollowButton';
import { FollowedArtist } from '@/types/models/ArtistFollow';
import { Radio } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface FollowedArtistCardProps {
  artist: FollowedArtist;
}

export function FollowedArtistCard({ artist }: FollowedArtistCardProps) {
  return (
    <div className="group relative flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all duration-300">
      <Link
        href={`/artist/${artist.artistId}`}
        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-3 border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300"
      >
        {artist.artistImageUrl ? (
          <Image
            src={artist.artistImageUrl}
            alt={artist.artistName}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/20 to-[#2A2A2E] flex items-center justify-center text-white/40">
            <Radio size={32} />
          </div>
        )}
      </Link>

      <Link
        href={`/artist/${artist.artistId}`}
        className="text-sm font-semibold text-white truncate max-w-full hover:text-[#FA243C] transition-colors"
      >
        {artist.artistName}
      </Link>

      <div className="mt-1 mb-3 flex items-center gap-1.5">
        <span className="text-xs text-white/50">Artist</span>
        {artist.hasStation && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#FA243C] bg-[#FA243C]/10 px-1.5 py-0.5 rounded-full font-medium">
            <Radio size={9} />
            <span>Station</span>
          </span>
        )}
      </div>

      <FollowButton
        artistId={artist.artistId}
        artistName={artist.artistName}
        artistImage={artist.artistImageUrl}
        className="w-full max-w-[120px]"
      />
    </div>
  );
}
