import Link from 'next/link';
import Image from 'next/image';
import { Music } from 'lucide-react';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';

interface OtherProfilePlaylistsProps {
  publicPlaylists: any[];
}

export default function OtherProfilePlaylists({ publicPlaylists }: OtherProfilePlaylistsProps) {
  if (publicPlaylists.length === 0) {
    return (
      <div data-animate className="px-5 md:px-8 mt-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-bold text-white tracking-tight">
            Public Playlists
          </h2>
        </div>
        <div className="text-center py-12 px-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
          <Music size={36} className="text-white/10 mx-auto mb-3" />
          <p className="text-[15px] text-white/50">No public playlists</p>
          <p className="text-[13px] text-white/30 mt-1">
            This user hasn&apos;t shared any playlists publicly yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-animate className="mt-8">
      <HorizontalScrollSection title="Public Playlists">
        {publicPlaylists.map((playlist) => (
          <Link
            key={playlist.id}
            href={`/playlist/${playlist.id}`}
            className="group flex flex-col gap-2 flex-shrink-0 w-[140px] md:w-[160px]"
          >
            <div className="relative aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-white/5 shadow-md border border-white/5 transition-transform duration-300 group-hover:scale-[1.03]">
              {playlist.cover_url ? (
                <Image
                  src={playlist.cover_url}
                  alt={playlist.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FA243C]/20 to-[#FA243C]/5 flex items-center justify-center">
                  <Music size={32} className="text-[#FA243C]/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="px-0.5 mt-0.5">
              <p className="text-[14px] font-medium text-white/95 truncate leading-snug">
                {playlist.name}
              </p>
              <p className="text-[12px] text-white/40 truncate mt-0.5">Playlist</p>
            </div>
          </Link>
        ))}
      </HorizontalScrollSection>
    </div>
  );
}
