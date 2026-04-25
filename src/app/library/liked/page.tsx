'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Heart } from 'lucide-react';

export default function LikedSongsPage() {
  return (
    <MainLayout>
      <div className="max-w-3xl">
        <h1 className="text-4xl font-display font-bold mb-4">Liked Songs</h1>
        <p className="text-muted mb-8">
          This is where songs you like will appear.
        </p>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto mb-5">
            <Heart size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-2">No liked songs yet</h2>
          <p className="text-muted">
            Tap the heart icon on any track to save it here.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
