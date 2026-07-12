import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      // If iPad or Tablet, always treat as Desktop UI (isMobile = false)
      const isTabletUA = /iPad/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth >= 600 && !/(?:iPhone|iPod|Windows Phone|Android.*Mobile|Mobi)/i.test(ua));
      if (isTabletUA) {
        setIsMobile(false);
        return;
      }
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Initial check
    checkIsMobile();

    // Add event listener
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  return isMobile;
}
