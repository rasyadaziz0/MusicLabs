import { ChevronRight } from 'lucide-react';
import React from 'react';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { ScrollArrows } from '@/components/ui/ScrollArrows';

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
      </div>
      <div className="relative group/section">
        <ScrollArrows 
          canScrollLeft={canScrollLeft} 
          canScrollRight={canScrollRight} 
          onScrollLeft={() => scroll('left')} 
          onScrollRight={() => scroll('right')} 
        />
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:-ml-[296px] md:pl-[296px] md:-mr-[40px] md:pr-[40px]"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
