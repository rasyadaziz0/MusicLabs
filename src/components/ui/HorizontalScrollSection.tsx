import { ChevronRight } from 'lucide-react';
import React from 'react';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';

interface HorizontalScrollSectionProps {
  title: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
}

export function HorizontalScrollSection({
  title,
  children,
  onSeeAll,
}: HorizontalScrollSectionProps) {
  const { scrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll();

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-5 pr-2">
        <h2
          className="text-[18px] font-semibold text-white cursor-pointer hover:text-[#FA243C] transition-colors inline-flex items-center group"
          onClick={onSeeAll}
        >
          {title}
          <ChevronRight
            size={18}
            className="text-white/40 ml-1 group-hover:text-[#FA243C] transition-colors"
          />
        </h2>
        <div className="flex items-center gap-1">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors"
            >
              <ChevronRight size={14} className="text-white rotate-180" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center transition-colors"
            >
              <ChevronRight size={14} className="text-white" />
            </button>
          )}
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-none pb-2 -mx-2 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}
