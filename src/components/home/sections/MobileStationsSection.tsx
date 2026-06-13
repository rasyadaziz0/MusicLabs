import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ScrollArrows } from '@/components/ui/ScrollArrows';
import { User } from '@supabase/supabase-js';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';

interface MobileStationsSectionProps {
  user: User | null;
  discoverPlaylistId?: string;
}

export function MobileStationsSection({ user, discoverPlaylistId }: MobileStationsSectionProps) {
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll();

  if (!user) return null;

  return (
    <section className="px-2 pt-4 md:hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold text-white">Made For You</h2>
      </div>
      <div className="relative group/section">
        <ScrollArrows 
          canScrollLeft={canScrollLeft} 
          canScrollRight={canScrollRight} 
          onScrollLeft={() => scroll('left')} 
          onScrollRight={() => scroll('right')} 
        />
      <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Made For You Card */}
        <Link href="/made-for-you" className="group flex-shrink-0 w-[160px] text-left">
          <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 border border-white/10 shadow-lg">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="grad-top" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff4b8b" />
                  <stop offset="100%" stopColor="#fa243c" />
                </linearGradient>
                <linearGradient id="grad-bot" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#cc0033" />
                  <stop offset="100%" stopColor="#fa243c" />
                </linearGradient>
                <linearGradient id="grad-mid" x1="0" y1="0.5" x2="1" y2="0.5">
                  <stop offset="0%" stopColor="#ff8a00" />
                  <stop offset="100%" stopColor="#fa243c" />
                </linearGradient>
                <linearGradient id="grad-mid2" x1="0" y1="0.5" x2="1" y2="0.5">
                  <stop offset="0%" stopColor="#ff5e62" />
                  <stop offset="100%" stopColor="#fa243c" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" fill="#fa243c" />
              <polygon points="0,0 100,50 100,0" fill="url(#grad-top)" />
              <polygon points="0,100 100,50 100,100" fill="url(#grad-bot)" />
              <polygon points="0,0 100,50 0,100" fill="url(#grad-mid)" />
              <polygon points="0,20 100,50 0,80" fill="url(#grad-mid2)" />
            </svg>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

            <div className="absolute top-2.5 right-2.5 flex items-center opacity-95">
              <span className="text-white font-bold text-[11px] tracking-tight ml-[3px] mt-[1px]">AcadMusic</span>
            </div>
          </div>
          <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug">Made For You</p>
          <p className="text-muted text-[13px] line-clamp-1 mt-0.5">Stasiun musik personal</p>
        </Link>

        {/* Discover Weekly Card */}
        {discoverPlaylistId ? (
          <Link href={`/playlist/${discoverPlaylistId}`} className="group flex-shrink-0 w-[160px] text-left">
            <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 border border-white/10 shadow-lg">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad-top2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4B0082" />
                    <stop offset="100%" stopColor="#230066" />
                  </linearGradient>
                  <linearGradient id="grad-bot2" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0066FF" />
                    <stop offset="100%" stopColor="#230066" />
                  </linearGradient>
                  <linearGradient id="grad-mid-2" x1="0" y1="0.5" x2="1" y2="0.5">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#230066" />
                  </linearGradient>
                  <linearGradient id="grad-mid2-2" x1="0" y1="0.5" x2="1" y2="0.5">
                    <stop offset="0%" stopColor="#00FF9D" />
                    <stop offset="100%" stopColor="#230066" />
                  </linearGradient>
                </defs>
                <rect width="100" height="100" fill="#230066" />
                <polygon points="0,0 100,50 100,0" fill="url(#grad-top2)" />
                <polygon points="0,100 100,50 100,100" fill="url(#grad-bot2)" />
                <polygon points="0,0 100,50 0,100" fill="url(#grad-mid-2)" />
                <polygon points="0,20 100,50 0,80" fill="url(#grad-mid2-2)" />
              </svg>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              
              <div className="absolute top-2.5 right-2.5 flex items-center opacity-95">
                <span className="text-white font-bold text-[11px] tracking-tight ml-[3px] mt-[1px]">AcadMusic</span>
              </div>
            </div>
            <p className="text-white font-medium text-[14px] line-clamp-1 leading-snug">Discover Weekly</p>
            <p className="text-muted text-[13px] line-clamp-1 mt-0.5">Lagu baru tiap minggu</p>
          </Link>
        ) : (
          <div className="group flex-shrink-0 w-[160px] text-left opacity-50 cursor-not-allowed">
            <div className="relative aspect-square rounded-[12px] overflow-hidden mb-3 bg-white/5 border border-white/10 flex flex-col items-center justify-center p-4 shadow-lg">
              <Sparkles size={36} className="text-white opacity-50 mb-2" />
              <span className="text-white/50 font-bold text-[18px] leading-tight text-center tracking-tight">Discover<br />Weekly</span>
            </div>
            <p className="text-white/50 font-medium text-[14px] line-clamp-1 leading-snug">Belum Tersedia</p>
            <p className="text-muted text-[13px] line-clamp-1 mt-0.5">Butuh history lagu</p>
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
