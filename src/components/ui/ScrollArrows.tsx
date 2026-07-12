import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollArrowsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export function ScrollArrows({ canScrollLeft, canScrollRight, onScrollLeft, onScrollRight }: ScrollArrowsProps) {
  const arrowStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.08) 100%), rgba(30, 30, 34, 0.7)',
    boxShadow:
      'inset 0 1px 1px rgba(255,255,255,0.23),' +
      'inset 0 -1px 1px rgba(255,255,255,0.08),' +
      '0 12px 34px rgba(0,0,0,0.45)',
  };

  return (
    <>
      {canScrollLeft && (
        <button
          onClick={onScrollLeft}
          aria-label="Scroll left"
          className="hidden md:block absolute -left-[12px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 p-0 m-0 border-none bg-transparent group/arrow"
        >
          <div className="w-full h-full opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 [transform:translateZ(0)] will-change-opacity">
            <div
              className="w-full h-full rounded-full flex items-center justify-center hover:scale-105 hover:brightness-125 transition-all"
              style={arrowStyle}
            >
              <ChevronLeft size={24} className="text-white/80 group-hover/arrow:text-white transition-colors" />
            </div>
          </div>
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={onScrollRight}
          aria-label="Scroll right"
          className="scroll-arrow-right hidden md:block absolute -right-[24px] top-1/2 -translate-y-1/2 z-20 w-10 h-10 p-0 m-0 border-none bg-transparent group/arrow"
        >
          <div className="w-full h-full opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 [transform:translateZ(0)] will-change-opacity">
            <div
              className="w-full h-full rounded-full flex items-center justify-center hover:scale-105 hover:brightness-125 transition-all"
              style={arrowStyle}
            >
              <ChevronRight size={24} className="text-white/80 group-hover/arrow:text-white transition-colors" />
            </div>
          </div>
        </button>
      )}
    </>
  );
}

