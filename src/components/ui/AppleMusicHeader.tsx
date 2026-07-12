import { ReactNode } from 'react';
import { Play, Shuffle, Check, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export interface AppleMusicHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  cover: ReactNode;
  onPlay?: () => void;
  onShuffle?: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  extraActions?: ReactNode;
  topRightActions?: ReactNode;
  backHref?: string;
}

import { useRouter } from 'next/navigation';

export function AppleMusicHeader({
  title,
  subtitle,
  description,
  cover,
  onPlay,
  onShuffle,
  isSaved,
  onToggleSave,
  extraActions,
  topRightActions,
  backHref,
}: AppleMusicHeaderProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    router.back();
  };

  return (
    <div className="w-full">
      {/* Top Navigation Row: Back button on Left, topRightActions (Heart / Options) horizontally aligned exactly opposite on Right (`sejajar sama tombol back`) */}
      <div className="flex items-center justify-between w-full mb-6 pt-2">
        {backHref ? (
          <>
            <div className="hidden md:block">
              <button 
                onClick={handleBack} 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-sm font-medium active:scale-95 shadow-md"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
                Kembali
              </button>
            </div>
            <div className="block md:hidden">
              <button 
                onClick={handleBack} 
                className="p-2 text-[#FA243C] hover:bg-white/5 rounded-full transition-colors flex items-center justify-center active:scale-90"
              >
                <ChevronLeft size={28} strokeWidth={2.5} />
              </button>
            </div>
          </>
        ) : <div />}

        {topRightActions && (
          <div className="flex items-center gap-3">
            {topRightActions}
          </div>
        )}
      </div>

      <section className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8 relative">
        {/* Artwork */}
        <div className="w-56 h-56 md:w-[260px] md:h-[260px] flex-shrink-0 bg-white/5 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden">
          {cover}
        </div>
        
        {/* Info & Controls */}
        <div className="flex flex-col items-center md:items-start mt-4 md:mt-auto md:mb-4 w-full">
          <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-2 mb-2 tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-[#FA243C] font-medium mb-1">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-xs font-medium text-white/50 mb-6 uppercase tracking-wider">
              {description}
            </p>
          )}
          
          <div className="flex items-center justify-center md:justify-start gap-3 w-full flex-wrap">
            {onShuffle && (
              <button 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white shadow-md shadow-black/30"
                onClick={onShuffle}
              >
                <Shuffle size={18} />
              </button>
            )}
            
            {onPlay && (
              <button 
                className="h-10 px-8 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-md shadow-black/30"
                onClick={onPlay}
              >
                <Play size={18} fill="currentColor" />
                Play
              </button>
            )}
            
            {onToggleSave && (
              <button 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white shadow-md shadow-black/30"
                onClick={onToggleSave}
              >
                {isSaved ? <Check size={18} /> : <Check size={18} className="opacity-50" />}
              </button>
            )}

            {extraActions}
          </div>
        </div>
      </section>
    </div>
  );
}
