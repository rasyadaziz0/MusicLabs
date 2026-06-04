import Image from 'next/image';
import Link from 'next/link';

export interface AlbumData {
  id: string;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  nb_tracks: number;
  artist: string;
  release_date: string;
  album_type: string;
}

export function AlbumCard({ album }: { album: AlbumData }) {
  const cover = album.cover_xl || album.cover_big || album.cover;
  const year = album.release_date
    ? new Date(album.release_date).getFullYear()
    : '';

  return (
    <Link
      href={`/album/${album.id}`}
      className="flex-shrink-0 w-[170px] group cursor-pointer"
    >
      <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.5)] bg-white/5">
        {cover ? (
          <Image
            src={cover}
            alt={album.title}
            fill
            sizes="170px"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
            <span className="text-white/20 text-3xl">💿</span>
          </div>
        )}
      </div>
      <p className="text-[13px] font-medium text-white truncate leading-tight group-hover:text-white/90">
        {album.title}
      </p>
      <p className="text-[12px] text-white/40 truncate mt-[2px]">{year}</p>
    </Link>
  );
}
