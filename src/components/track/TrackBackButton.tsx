'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface TrackBackButtonProps {
  mode: 'desktop' | 'mobile';
}

export default function TrackBackButton({ mode }: TrackBackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (mode === 'desktop') {
    return (
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-sm font-medium active:scale-95 shadow-md"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
        Kembali
      </button>
    );
  }

  // mobile mode: icon button
  return (
    <button
      onClick={handleBack}
      aria-label="Kembali"
      title="Kembali"
      className="p-2 text-[#FA243C] hover:bg-white/5 rounded-full transition-colors flex items-center justify-center active:scale-90"
    >
      <ChevronLeft size={28} strokeWidth={2.5} />
    </button>
  );
}
