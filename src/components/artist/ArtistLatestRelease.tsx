'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { AlbumData } from '@/components/ui/AlbumCard';

interface ArtistLatestReleaseProps {
  latestRelease: AlbumData | null;
}

export function ArtistLatestRelease({ latestRelease }: ArtistLatestReleaseProps) {
  return (
    <div>
      <h2 className="text-[17px] font-semibold text-white mb-4">
        Latest Release
      </h2>
      {latestRelease ? (
        <div className="flex gap-4">
          <Link
            href={`/album/${latestRelease.id}`}
            className="relative w-[140px] h-[140px] rounded-lg overflow-hidden flex-shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] bg-white/5 group"
          >
            <Image
              src={latestRelease.cover_xl || latestRelease.cover_big || latestRelease.cover || ''}
              alt={latestRelease.title}
              fill
              sizes="140px"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          </Link>
          <div className="flex flex-col justify-center min-w-0">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">
              {latestRelease.release_date
                ? new Date(latestRelease.release_date)
                    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    .toUpperCase()
                : 'LATEST'}
            </p>
            <Link
              href={`/album/${latestRelease.id}`}
              className="text-[16px] font-semibold text-white leading-tight mb-0.5 hover:underline truncate"
            >
              {latestRelease.title}
            </Link>
            <p className="text-[13px] text-white/40 mb-4">
              {latestRelease.nb_tracks || 1}{' '}
              {latestRelease.nb_tracks > 1 ? 'songs' : 'song'}
            </p>

            <button className="flex items-center justify-center gap-1.5 px-4 py-[6px] bg-white/[0.07] hover:bg-white/[0.12] rounded-full text-[13px] font-semibold text-[#FA243C] transition-colors w-max border border-white/[0.06]">
              <Plus size={15} strokeWidth={2.5} /> Add
            </button>
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center text-white/30 text-[13px]">
          No releases available
        </div>
      )}
    </div>
  );
}
