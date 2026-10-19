'use client';

import { useTranslation } from '@/context/LanguageContext';
import { PlaylistSearchCard } from '@/components/search/PlaylistSearchCard';
import { PlaylistSearchResult } from '@/types/models/PlaylistLike';
import { motion } from 'framer-motion';
import { Library } from 'lucide-react';
import React from 'react';

interface PlaylistSearchResultsProps {
  playlists: PlaylistSearchResult[];
  isLoading: boolean;
  query: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function PlaylistSearchResults({
  playlists,
  isLoading,
  query,
}: PlaylistSearchResultsProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">{t('search.playlists')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
              <div className="aspect-square w-full rounded-xl bg-white/5" />
              <div className="h-4 w-3/4 rounded bg-white/10 mt-1" />
              <div className="h-3 w-1/2 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/40">
          <Library size={28} />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{t('profile.no_public_playlists')}</h3>
        <p className="text-sm text-white/50 max-w-sm">
          {query
            ? `${t('search.no_results')} "${query}".`
            : t('profile.no_public_playlists')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">{t('search.playlists')}</h2>
        <span className="text-xs text-white/40">{playlists.length} {t('search.found')}</span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
      >
        {playlists.map((playlist) => (
          <motion.div key={playlist.id} variants={itemVariants}>
            <PlaylistSearchCard playlist={playlist} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
