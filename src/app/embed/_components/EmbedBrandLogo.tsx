import { Music } from 'lucide-react';

/** AcadMusic brand logo used in embed player headers. */
export function EmbedBrandLogo() {
  return (
    <div className="flex items-center gap-1 font-bold text-[#1d1d1f] text-[13px] tracking-tight">
      <Music size={14} className="text-[#1d1d1f]" fill="currentColor" />
      <span>AcadMusic</span>
    </div>
  );
}
