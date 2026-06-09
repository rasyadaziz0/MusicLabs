'use client';

import { useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Music, Clock, Mic2, Play, Disc3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useAuth } from '@/context/AuthContext';
import { useReplayMonthly } from '@/hooks/useReplayMonthly';
import { usePlayer } from '@/context/PlayerContext';
import { StatCard, TopTrackCard, TopArtistCard } from '@/components/recap/RecapCards';
import { CustomSelect } from '@/components/ui/CustomSelect';

// ── Helpers ─────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function generateYears(startYear = 2024) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y);
  }
  return years;
}
// ── Main Page ───────────────────────────────────────────────

export default function RecapPage() {
  const { user, signInWithGoogle } = useAuth();
  const { playTrack } = usePlayer();
  const heroRef = useRef<HTMLDivElement>(null);

  const {
    year,
    month,
    setYear,
    setMonth,
    monthLabel,
    topTracks,
    topArtists,
    stats,
    hasData,
    isLoading,
  } = useReplayMonthly();

  const years = useMemo(() => generateYears(), []);

  // Disable future months in the current year
  const currentData = new Date();
  const currentYear = currentData.getFullYear();
  const currentMonth = currentData.getMonth();

  // GSAP hero entrance
  useEffect(() => {
    if (!heroRef.current || isLoading) return;
    const children = heroRef.current.querySelectorAll('[data-animate]');
    gsap.fromTo(
      children,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'all',
      },
    );
  }, [isLoading, month, year]);

  if (!user) {
    return (
      <div className="p-6 md:p-10 pt-16 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-[34px] font-bold tracking-tight text-white mb-4">Replay Monthly</h1>
        <p className="text-[15px] text-white/60 mb-8 max-w-md">
          Sign in to see your monthly listening stats, top tracks, and favourite artists.
        </p>
        <button
          onClick={() => signInWithGoogle()}
          className="px-8 py-3 rounded-full bg-[#FA243C] text-white font-bold hover:bg-opacity-90 transition-all active:scale-95"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 max-w-[1200px] mx-auto">
      {/* ── Hero ── */}
      <div className="px-4 md:px-8 pt-4 md:pt-8">
        <div ref={heroRef} className="am-replay-hero pt-12 pb-12 px-6 md:px-12 rounded-3xl border border-white/5 shadow-2xl">

          {/* Selectors */}
          <div className="relative z-50 flex flex-wrap items-center gap-3 mb-10" data-animate>
          <div className="relative z-50">
            <CustomSelect
              value={month}
              onChange={(val) => setMonth(Number(val))}
              options={MONTHS.map((m, idx) => ({
                value: idx,
                label: m,
                disabled: year === currentYear && idx > currentMonth,
              }))}
            />
          </div>

          <div className="relative z-50">
            <CustomSelect
              value={year}
              onChange={(val) => setYear(Number(val))}
              options={years.map((y) => ({
                value: y,
                label: y.toString(),
              }))}
            />
          </div>
        </div>

        {/* Big Apple typography */}
        <div className="relative z-10" data-animate>
          <h1 className="text-[52px] md:text-[80px] font-extrabold text-white tracking-tighter leading-[0.9] mb-4">
            Replay<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FA243C] to-[#FF9B26]">
              {monthLabel.split(' ')[0]}
            </span>
          </h1>
          <p className="text-[18px] md:text-[22px] font-medium text-white/70">
            Your top songs and artists of the month.
          </p>
        </div>
        </div>
      </div>

      <div className="px-5 md:px-12 pt-6">
        {/* ── Loading ── */}
        {isLoading && (
          <div className="space-y-12">
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-1 squircle h-[180px] bg-white/5 animate-pulse" />
              ))}
            </div>
            <div className="flex gap-4 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-[160px] aspect-square squircle bg-white/5 animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {!isLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${year}-${month}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {!hasData ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Disc3 size={64} className="text-white/10 mb-6" />
                  <h3 className="text-[24px] font-bold text-white mb-2 tracking-tight">Nothing to hear here.</h3>
                  <p className="text-[16px] text-white/50 max-w-sm">
                    You haven&apos;t played any tracks in {monthLabel}. Go listen to some music!
                  </p>
                </div>
              ) : (
                <div className="space-y-16">

                  {/* Milestones (Stats) */}
                  <section>
                    <h2 className="text-[26px] md:text-[32px] font-bold text-white mb-6 tracking-tight">Milestones</h2>
                    <div className="flex overflow-x-auto md:overflow-visible gap-4 md:gap-5 pb-6 md:pb-0 scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0">
                      <StatCard
                        label="Plays"
                        value={stats.totalTracks}
                        gradient="linear-gradient(135deg, #FF2A54, #FF5B24)"
                        delay={0}
                      />
                      <StatCard
                        label={Math.floor(stats.estimatedMinutes / 60) > 0 ? "Time" : "Minutes"}
                        value={
                          Math.floor(stats.estimatedMinutes / 60) > 0 ? (
                            <>
                              {Math.floor(stats.estimatedMinutes / 60)}
                              <span className="text-2xl md:text-3xl font-bold mx-1 text-white/80">h</span>
                              {stats.estimatedMinutes % 60}
                              <span className="text-2xl md:text-3xl font-bold ml-1 text-white/80">m</span>
                            </>
                          ) : (
                            <>
                              {stats.estimatedMinutes}
                              <span className="text-2xl md:text-3xl font-bold ml-1 text-white/80">m</span>
                            </>
                          )
                        }
                        gradient="linear-gradient(135deg, #A824FF, #5024FF)"
                        delay={0.1}
                      />
                      <StatCard
                        label="Artists"
                        value={stats.uniqueArtists}
                        gradient="linear-gradient(135deg, #24D0FF, #246BFF)"
                        delay={0.2}
                      />
                    </div>
                  </section>

                  {/* Top Songs */}
                  <section>
                    <h2 className="text-[26px] md:text-[32px] font-bold text-white mb-6 tracking-tight">Top Songs</h2>
                    <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0">
                      {topTracks.map((song, i) => (
                        <TopTrackCard
                          key={song.id}
                          song={song}
                          rank={i + 1}
                          onPlay={() => playTrack(song, topTracks)}
                          delay={0.3 + i * 0.05}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Top Artists */}
                  {topArtists.length > 0 && (
                    <section>
                      <h2 className="text-[26px] md:text-[32px] font-bold text-white mb-6 tracking-tight">Top Artists</h2>
                      <div className="flex overflow-x-auto gap-6 md:gap-8 pb-6 scrollbar-hide -mx-5 px-5 md:mx-0 md:px-0">
                        {topArtists.map((artist, i) => (
                          <TopArtistCard
                            key={artist.name}
                            name={artist.name}
                            imageUrl={artist.imageUrl}
                            rank={i + 1}
                            delay={0.4 + i * 0.1}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
