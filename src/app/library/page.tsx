'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Library } from 'lucide-react';

export default function LibraryPage() {
  return (
    <MainLayout>
      <div className="max-w-3xl">
        <h1 className="text-4xl font-display font-bold mb-4">Your Library</h1>
        <p className="text-muted mb-8">
          Explore your playlists and liked songs in one place.
        </p>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-5">
            <Library size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Library is ready</h2>
          <p className="text-muted">
            Open Liked Songs from the sidebar or create a new playlist to start building your collection.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
