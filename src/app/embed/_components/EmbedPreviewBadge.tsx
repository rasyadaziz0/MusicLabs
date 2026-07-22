import { cn } from '@/lib/utils';

interface EmbedPreviewBadgeProps {
  isVisible: boolean;
  className?: string;
}

/** Floating badge indicating that the playback is an iTunes preview */
export function EmbedPreviewBadge({ isVisible, className }: EmbedPreviewBadgeProps) {
  if (!isVisible) return null;
  
  return (
    <div className={cn("absolute left-1/2 -translate-x-1/2 bg-[#1d1d1f]/80 backdrop-blur-md text-white text-[10px] font-medium px-3 py-1.5 rounded-full pointer-events-none shadow-sm z-10 transition-opacity", className)}>
      AcadMusic Preview
    </div>
  );
}
