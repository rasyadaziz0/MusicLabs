'use client';

import { motion } from 'framer-motion';
import { GlassBar } from '@/components/ui/LiquidGlass';
import { DynamicGradientBackground } from '@/components/player/DynamicGradientBackground';
import Link from 'next/link';

import { useStatusPage } from '@/hooks/useStatusPage';
import { SystemMetricsChart } from '@/components/status/SystemMetricsChart';
import { 
  StatusDot, 
  ComponentRow, 
  SkeletonRow, 
  overallLabel, 
  formatTime 
} from '@/components/status/StatusHelpers';

export default function StatusPage() {
  const { report, loading, lastChecked, refetch } = useStatusPage();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white font-[family-name:var(--font-body)]">
      
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        <DynamicGradientBackground 
          coverUrl="/musiclabs-cover.jpg" 
          trackId="status"
          className="opacity-70"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Global minimal navbar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10 sm:py-7"
      >
        <Link href="/">
          <GlassBar className="rounded-full px-5 py-2 shadow-lg hover:bg-white/10 transition-colors">
            <div className="text-[17px] font-bold tracking-[-0.025em] text-white font-[family-name:var(--font-display)]">
              AcadMusic
            </div>
          </GlassBar>
        </Link>
        <GlassBar className="rounded-full px-4 py-2 shadow-lg">
          <div className="text-[13px] font-medium text-white/70">
            System Status
          </div>
        </GlassBar>
      </motion.header>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-36 pb-24">
        {/* Header */}
        <header className="mb-14">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[40px] font-bold leading-tight tracking-[-0.02em] font-[family-name:var(--font-display)] mb-4"
          >
            System Status
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full bg-white/20 animate-pulse" />
                <span className="h-6 w-56 rounded bg-white/20 animate-pulse" />
              </div>
            ) : report ? (
              <div className="flex items-center gap-3">
                <StatusDot status={report.overall} />
                <span className="text-[19px] font-medium text-white/90 tracking-tight">
                  {overallLabel(report.overall)}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              {lastChecked && (
                <span className="text-[13px] text-white/50 tabular-nums">
                  Last updated: {formatTime(lastChecked)}
                </span>
              )}
              <button
                onClick={refetch}
                disabled={loading}
                className="text-[13px] font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </motion.div>
        </header>

        {/* Components List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-white/10"
        >
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : report?.components.length ? (
            report.components.map((c) => (
              <ComponentRow key={c.name} component={c} />
            ))
          ) : (
            <div className="py-10 text-center text-[15px] text-white/40">
              Unable to retrieve status information.
            </div>
          )}
        </motion.div>

        {/* API Latency Chart */}
        <SystemMetricsChart />

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-white/10 text-[12px] text-white/30 flex flex-col sm:flex-row justify-between gap-2">
          <p>Auto-refreshes every 30 seconds.</p>
          <p>Copyright © {new Date().getFullYear()} AcadMusic. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
