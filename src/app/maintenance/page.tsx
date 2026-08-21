'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { GlassBar } from '@/components/ui/LiquidGlass';
import { DynamicGradientBackground } from '@/components/player/DynamicGradientBackground';

export default function MaintenancePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">

      <div className="absolute inset-0">
        {/* Animated WebGL Background */}
        <DynamicGradientBackground 
          coverUrl="/musiclabs-cover.jpg" 
          trackId="maintenance"
          className="opacity-80"
        />

        {/* Dark cinematic overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Bottom fade for readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/70 to-transparent"
        />

        {/* Subtle top fade */}
        <div
          className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent"
        />
      </div>

      {/* ============================================================
          NAV / BRAND
      ============================================================ */}

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10 sm:py-7"
      >
        <GlassBar className="rounded-full px-5 py-2 shadow-lg">
          <div className="text-[17px] font-bold tracking-[-0.025em] text-white">
            Acadmusic
          </div>
        </GlassBar>

        <GlassBar className="rounded-full px-4 py-2 shadow-lg">
          <div className="text-[13px] font-medium text-white/70">
            System update
          </div>
        </GlassBar>
      </motion.header>

      {/* ============================================================
          MAIN
      ============================================================ */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex w-full max-w-[600px] flex-col items-center text-center"
        >
          {/* ========================================================
              ARTWORK
          ======================================================== */}

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative mb-10 flex w-full max-w-[280px] flex-col items-center"
          >
            {/* SVG Connections & Checkmarks */}
            <div className="relative h-[80px] w-full">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 80" fill="none">
                {/* Center Node */}
                <path d="M140 80 L140 36" stroke="#4a4a4a" strokeWidth="2" />
                <circle cx="140" cy="20" r="14" fill="#666" />
                <path d="M135 20 l3 3 l6 -6" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Left Node */}
                <path d="M110 80 L110 60 L60 60 L60 36" stroke="#4a4a4a" strokeWidth="2" />
                <circle cx="60" cy="20" r="14" fill="#666" />
                <path d="M55 20 l3 3 l6 -6" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Right Node */}
                <path d="M170 80 L170 60 L220 60 L220 36" stroke="#4a4a4a" strokeWidth="2" />
                <circle cx="220" cy="20" r="14" fill="#666" />
                <path d="M215 20 l3 3 l6 -6" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Server Stack */}
            <div className="relative z-10 flex w-[180px] flex-col gap-1">
              {/* Server 1 */}
              <div className="flex h-[42px] w-full items-center justify-between rounded-[4px] border-[1.5px] border-[#666] bg-transparent px-4 shadow-lg backdrop-blur-sm">
                <div className="flex gap-[5px]">
                  <div className="h-4 w-2 rounded-[2px] bg-[#888]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#888]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#888]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#333]" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-[2px] w-12 bg-[#888]" />
                  <div className="h-[2px] w-12 bg-[#888]" />
                  <div className="h-[2px] w-12 bg-[#888]" />
                </div>
              </div>
              
              {/* Server 2 */}
              <div className="flex h-[42px] w-full items-center justify-between rounded-[4px] border-[1.5px] border-[#666] bg-transparent px-4 shadow-lg backdrop-blur-sm">
                <div className="flex gap-[5px]">
                  <div className="h-4 w-2 rounded-[2px] bg-[#888]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#333]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#888]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#333]" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-[2px] w-12 bg-[#888]" />
                  <div className="h-[2px] w-12 bg-[#888]" />
                  <div className="h-[2px] w-12 bg-[#888]" />
                </div>
              </div>

              {/* Server 3 */}
              <div className="flex h-[42px] w-full items-center justify-between rounded-[4px] border-[1.5px] border-[#666] bg-transparent px-4 shadow-lg backdrop-blur-sm">
                <div className="flex gap-[5px]">
                  <div className="h-4 w-2 rounded-[2px] bg-[#888]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#888]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#333]" />
                  <div className="h-4 w-2 rounded-[2px] bg-[#333]" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-[2px] w-12 bg-[#888]" />
                  <div className="h-[2px] w-12 bg-[#888]" />
                  <div className="h-[2px] w-12 bg-[#888]" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ========================================================
              TITLE
          ======================================================== */}

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            className="max-w-[540px] text-[38px] font-bold leading-[1.05] tracking-[-0.045em] sm:text-[48px]"
          >
            Under Maintenance
          </motion.h1>

          {/* ========================================================
              DESCRIPTION
          ======================================================== */}

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.34 }}
            className="mt-5 max-w-[470px] text-[16px] leading-7 tracking-[-0.01em] text-white/65 sm:text-[17px]"
          >
            Acadmusic sedang melakukan beberapa peningkatan
            untuk membuat pengalaman mendengarkan musik
            menjadi lebih cepat dan nyaman.
          </motion.p>


        </motion.div>
      </div>

      {/* ============================================================
          BOTTOM FLOATING CONTROL
      ============================================================ */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          delay: 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 sm:bottom-8"
      >
        <GlassBar
          className="rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center gap-4 px-5 py-3">
            <a
              href="https://kreate.gg/acadmusic"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full hover:bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/70 transition-all hover:text-white"
            >
              <svg className="h-3.5 w-3.5 text-[#fa233b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Support Developer
            </a>

            <div className="h-3.5 w-[1px] bg-white/20" />

            <Link
              href="/status"
              className="flex items-center gap-2 rounded-full hover:bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/70 transition-all hover:text-white"
            >
              <svg className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check Status
            </Link>

            {/* loading indicator */}
            <div className="flex items-center gap-[3px]">
              {[8, 12, 16, 11, 7].map((height, index) => (
                <motion.span
                  key={index}
                  animate={{
                    height: [
                      `${height * 0.55}px`,
                      `${height}px`,
                      `${height * 0.7}px`,
                    ],
                  }}
                  transition={{
                    duration: 1.1,
                    delay: index * 0.08,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="block w-[3px] rounded-full bg-white/55"
                />
              ))}
            </div>
          </div>
        </GlassBar>
      </motion.div>
    </main>
  );
}