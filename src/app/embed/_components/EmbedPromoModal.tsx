import { X } from 'lucide-react';
import { EmbedBrandLogo } from './EmbedBrandLogo';

interface EmbedPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Login promo overlay shown to guest users when playback pauses/ends. */
export function EmbedPromoModal({ isOpen, onClose }: EmbedPromoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] w-full max-w-[280px] p-5 relative text-center border border-black/[0.06]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-[22px] h-[22px] bg-black/10 rounded-full flex items-center justify-center text-[#86868b] hover:bg-black/20 transition-colors"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
        <div className="flex justify-center mb-1">
          <EmbedBrandLogo />
        </div>
        <h2 className="font-bold text-[17px] text-[#1d1d1f] mt-2 mb-4 leading-snug">
          Putar dan unduh jutaan lagu.
        </h2>
        <div className="flex gap-2">
          <a href="/login" target="_blank" className="flex-1 bg-[#fa243c] text-white text-center rounded-[8px] py-2 font-bold text-[13px] hover:bg-[#d91f33] transition-colors no-underline">
            Coba Sekarang
          </a>
          <a href="/login" target="_blank" className="flex-1 bg-[#fae5e5] text-[#fa243c] text-center rounded-[8px] py-2 font-bold text-[13px] hover:bg-[#f5d5d5] transition-colors no-underline">
            Masuk
          </a>
        </div>
      </div>
    </div>
  );
}
