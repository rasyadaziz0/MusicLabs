'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopNavigationProps {
  mode: 'audd' | 'speech';
  setMode: (mode: 'audd' | 'speech') => void;
  isSpeechSupported: boolean;
}

export function TopNavigation({ mode, setMode, isSpeechSupported }: TopNavigationProps) {
  const router = useRouter();

  return (
    <header className="relative z-20 flex items-center justify-between px-4 pt-12 pb-4">
      <button
        onClick={() => router.back()}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/40 transition-colors"
      >
        <ChevronLeft size={28} />
      </button>
      
      {/* Apple style segmented control */}
      <div className="flex bg-[#1c1c1e]/80 backdrop-blur-xl rounded-full p-1 border border-white/5 shadow-lg">
        <button
          onClick={() => setMode('audd')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            mode === 'audd'
              ? 'bg-white text-black shadow-sm'
              : 'text-white/60'
          }`}
        >
          Identify
        </button>
        <button
          onClick={() => setMode('speech')}
          disabled={!isSpeechSupported}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            mode === 'speech'
              ? 'bg-white text-black shadow-sm'
              : 'text-white/60'
          } ${!isSpeechSupported ? 'opacity-30' : ''}`}
        >
          Sing/Say
        </button>
      </div>
      
      <div className="w-10" /> {/* Spacer for centering */}
    </header>
  );
}
