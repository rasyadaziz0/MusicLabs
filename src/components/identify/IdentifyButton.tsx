'use client';

import { useState, useEffect } from 'react';
import { AudioLines } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import IdentifyModal from './IdentifyModal';

interface IdentifyButtonProps {
  /** Visual variant */
  variant?: 'sidebar' | 'mobile';
  /** Custom className override */
  className?: string;
}

/**
 * A standalone button that opens the IdentifyModal.
 * - `sidebar`: icon + label, matches existing Sidebar nav style
 * - `mobile`: compact round button for MobileNav
 */
export default function IdentifyButton({ variant = 'sidebar', className }: IdentifyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams?.get('modal') === 'identify') {
      setIsOpen(true);
      // Clean up URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('modal');
      const newUrl = pathname + (newParams.toString() ? `?${newParams.toString()}` : '');
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  if (variant === 'mobile') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all text-[#FA243C]/80 hover:text-[#FA243C] active:scale-95 ${className ?? ''}`}
          title="Identify Song"
        >
          <AudioLines size={24} strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Identify</span>
        </button>
        <IdentifyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  // Default: sidebar
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-3 px-3 py-1.5 mx-2 rounded-md transition-colors text-[13px] font-medium border border-transparent text-white/80 hover:bg-white/5 w-full text-left ${className ?? ''}`}
      >
        <AudioLines size={18} className="text-[#FA243C]" />
        <span>Identify Song</span>
      </button>
      <IdentifyModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
