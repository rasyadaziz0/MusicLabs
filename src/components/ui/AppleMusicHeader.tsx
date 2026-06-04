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
      {/* Desktop Back Button */}
      {backHref && (
        <div className="hidden md:flex mb-6 w-full">
          <button 
            onClick={handleBack} 
            className="inline-flex items-center gap-2 px-3 py-1.5 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-sm font-medium"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            Back
          </button>
        </div>
      )}

      <section className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8 pt-4 md:pt-0 relative">
        {topRightActions && (
          <div className="absolute right-0 top-0 z-20">
            {topRightActions}
          </div>
        )}

        {backHref && (
          <div className="absolute left-0 top-0 z-20 md:hidden">
            <button onClick={handleBack} className="p-2 -ml-2 text-[#FA243C] hover:bg-white/5 rounded-full transition-colors flex items-center justify-center">
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
          </div>
        )}

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
        
        <div className="flex items-center justify-center md:justify-start gap-3 w-full">
          {onShuffle && (
            <button 
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              onClick={onShuffle}
            >
              <Shuffle size={18} />
            </button>
          )}
          
          {onPlay && (
            <button 
              className="h-10 px-8 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
              onClick={onPlay}
            >
              <Play size={18} fill="currentColor" />
              Play
            </button>
          )}
          
          {onToggleSave && (
            <button 
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
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
