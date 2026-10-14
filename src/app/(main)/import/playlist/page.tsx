'use client';

import FeatureDisabled from '@/components/ui/FeatureDisabled';
import PlaylistImporter from '@/components/playlist/PlaylistImporter';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function ImportPlaylistContent() {
  const { flags } = useFeatureFlags();

  if (!flags.feature_import_playlist) {
    return <FeatureDisabled />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-36 px-4 pt-2 md:px-6 md:pt-4 md:pb-32">
      {/* Mobile Header */}
      <div className="flex items-center gap-1 mb-2 md:hidden">
        <Link
          href="/library"
          className="rounded-full p-2 -ml-2 text-[#FA243C] hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-white">Import Playlist</h1>
      </div>

      {/* Desktop Header */}
      <h1 className="text-3xl font-bold text-white mb-6 hidden md:block">Import Playlist</h1>

      <PlaylistImporter />
    </div>
  );
}

export default function ImportPlaylistPage() {
  return (
    <Suspense fallback={null}>
      <ImportPlaylistContent />
    </Suspense>
  );
}
