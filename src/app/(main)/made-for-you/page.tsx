'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useMadeForYou } from '@/hooks/useMadeForYou';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { HorizontalScrollSection } from '@/components/ui/HorizontalScrollSection';
import { TrackCard } from '@/components/home/HomeCards';

export default function MadeForYouPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const { playTrack } = usePlayer();
  const { sections, discoverWeekly, isLoading, hasPersonalData } = useMadeForYou();

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-32 pt-2 md:px-8 md:pt-8">
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/library" className="rounded-full p-2 -ml-2 text-[#FA243C] hover:bg-white/5 transition-colors">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-white">Made For You</h1>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#FA243C]/20 via-[#2F2FE4]/10 to-transparent p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Sparkles size={14} className="text-[#FA243C]" />
              Personal Mixes
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Made For You</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60 md:text-base">
              Kumpulan mix personal yang dibangun dari history, lagu yang kamu like, mood, dan Discover Weekly.
            </p>
          </div>
        </div>
      </section>

      {!user ? (
        <LibraryEmptyState
          title="Login dulu buat buka personal mixes"
          description="Begitu login, halaman ini bakal otomatis ngumpulin mix dari listening history dan lagu yang kamu suka."
          ctaLabel="Login with Google"
          onCtaClick={() => signInWithGoogle('/made-for-you')}
        />
      ) : (
        <>
          {/* Discover Weekly block has been removed to keep it a secret/surprise feature */}

          {isLoading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="space-y-4">
                  <div className="h-6 w-40 rounded bg-white/5 animate-pulse" />
                  <div className="flex gap-4 overflow-hidden">
                    {[...Array(5)].map((__, cardIndex) => (
                      <div key={cardIndex} className="aspect-square w-[160px] rounded-xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : sections.length > 0 ? (
            sections.map((section) => (
              <HorizontalScrollSection key={section.key} title={section.title}>
                {section.tracks.map((song) => (
                  <TrackCard
                    key={`${section.key}-${song.id}`}
                    song={song}
                    onPlay={() => playTrack(song, section.tracks)}
                  />
                ))}
              </HorizontalScrollSection>
            ))
          ) : hasPersonalData ? (
            <LibraryEmptyState
              title="Mix personal belum kebentuk"
              description="Data kamu udah ada, tapi belum cukup kuat buat bikin section yang rapi. Coba puter beberapa lagu lagi."
              ctaHref="/search"
              ctaLabel="Cari Lagu"
            />
          ) : (
            <LibraryEmptyState
              title="Belum ada cukup history"
              description="Mulai dengerin lagu, like track favorit, atau bikin playlist. Nanti halaman ini bakal otomatis ngisi mix personal buat kamu."
              ctaHref="/"
              ctaLabel="Balik ke Home"
            />
          )}
        </>
      )}
    </div>
  );
}
