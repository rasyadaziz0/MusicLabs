'use client';

import MainLayout from '@/components/layout/MainLayout';
import { getHomeFeed } from '@/lib/api/musicApi';
import { useQuery } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { getBestImageUrl } from '@/lib/api/musicApi';
import { Song } from '@/types/music';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['homeFeed'],
    queryFn: () => getHomeFeed(),
  });

  const { playTrack } = usePlayer();

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      gsap.from(containerRef.current.querySelectorAll('section'), {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out'
      });
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-white/5 rounded-3xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  const trendingSongs = homeData?.trending?.songs || [];

  return (
    <MainLayout>
      <div ref={containerRef} className="space-y-12 pb-10">
        {/* Hero Section */}
        <section>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-8 tracking-tight">
            Explore <span className="text-primary">New Beats</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingSongs.slice(0, 3).map((song: Song) => (
              <div 
                key={song.id}
                className="group relative overflow-hidden rounded-3xl aspect-[16/9] cursor-pointer"
                onClick={() => playTrack(song, trendingSongs)}
              >
                <Image 
                  src={getBestImageUrl(song.image)} 
                  alt={song.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-xl font-bold mb-1 line-clamp-1">{song.name}</h3>
                  <p className="text-sm text-muted mb-4">{song.artists.primary.map(a => a.name).join(', ')}</p>
                  <button className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Play size={24} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Trending Now</h2>
            <button className="text-sm font-bold text-muted hover:text-white transition-colors">See all</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {trendingSongs.slice(3, 15).map((song: Song) => (
              <div 
                key={song.id}
                className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                onClick={() => playTrack(song, trendingSongs)}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-lg">
                  <Image 
                    src={getBestImageUrl(song.image)} 
                    alt={song.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-sm truncate mb-1">{song.name}</h4>
                <p className="text-xs text-muted truncate">{song.artists.primary.map(a => a.name).join(', ')}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
