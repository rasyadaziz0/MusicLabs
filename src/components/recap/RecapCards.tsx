import Image from 'next/image';
import { Play, Mic2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';

// ── Stat Card ───────────────────────────────────────────
export function StatCard({
  label,
  value,
  gradient,
  delay,
  suffix = '',
}: {
  label: string;
  value: number;
  gradient: string;
  delay: number;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex-1 min-w-[150px] aspect-square md:aspect-auto md:h-[180px]"
    >
      <div
        className="absolute inset-0 squircle p-5 md:p-6 flex flex-col justify-between overflow-hidden group"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(255,255,255,0.1)] pointer-events-none" />
        <p className="text-[15px] md:text-[17px] font-semibold text-white/90 uppercase tracking-wide z-10">
          {label}
        </p>
        <div className="z-10 mt-auto">
          <motion.p
            className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: delay + 0.2 }}
          >
            {value.toLocaleString()}
            {suffix && <span className="text-2xl md:text-3xl font-bold ml-1">{suffix}</span>}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Track Card ──────────────────────────────────────────
export function TopTrackCard({
  song,
  rank,
  onPlay,
  delay,
}: {
  song: Song;
  rank: number;
  onPlay: () => void;
  delay: number;
}) {
  const coverUrl = getBestImageUrl(song.image);
  const artistNames = song.artists?.primary?.map((a) => a.name).join(', ') || 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col gap-3 w-[140px] md:w-[160px] flex-shrink-0"
    >
      <div 
        className="relative aspect-square squircle overflow-hidden bg-white/5 cursor-pointer shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-2xl"
        onClick={onPlay}
      >
        {coverUrl && (
          <Image src={coverUrl} alt={song.name} fill sizes="160px" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <Play
            size={32}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
            fill="white"
          />
        </div>
        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 text-white font-bold text-[14px]">
          {rank}
        </div>
      </div>
      
      <div className="px-1">
        <p className="text-[15px] font-bold text-white truncate leading-snug cursor-pointer hover:underline" onClick={onPlay}>
          {song.name}
        </p>
        <p className="text-[14px] text-white/50 truncate mt-0.5">{artistNames}</p>
      </div>
    </motion.div>
  );
}

// ── Artist Card ─────────────────────────────────────────
export function TopArtistCard({
  name,
  imageUrl,
  rank,
  delay,
}: {
  name: string;
  imageUrl: string | undefined;
  rank: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 w-[140px] md:w-[160px] group"
    >
      <div className="relative aspect-square rounded-full overflow-hidden bg-white/5 shadow-lg border-2 border-transparent group-hover:border-white/20 transition-all duration-300 group-hover:scale-105">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes="160px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FA243C]/20 to-[#2F2FE4]/20">
            <Mic2 size={40} className="text-white/30" />
          </div>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold text-[13px] border border-white/10 shadow-lg">
          #{rank}
        </div>
      </div>
      <p className="text-[16px] font-bold text-center text-white mt-4 truncate px-2">
        {name}
      </p>
    </motion.div>
  );
}
