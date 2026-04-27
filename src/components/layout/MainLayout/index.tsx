'use client';

import React, { useEffect, useState } from 'react';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';
import { ILayoutProps } from './BaseLayout';

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

// Factory / Strategy Pattern (Polymorphism)
class LayoutFactory {
  // Secara polimorfik me-return komponen yang meng-inherit dari BaseLayout
  static createLayout(isDesktop: boolean, props: ILayoutProps): React.ReactNode {
    if (isDesktop) {
      return <DesktopLayout {...props} />;
    }
    return <MobileLayout {...props} />;
  }
}

export default function MainLayout(props: ILayoutProps) {
  // State encapsulation
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    
    // Deteksi ukuran layar untuk Strategy Pattern
    const mediaQueryList = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', onChange);

    return () => {
      mediaQueryList.removeEventListener('change', onChange);
    };
  }, []);

  // Hydration fallback
  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden bg-void">
        {/* Render fallback base encapsulation background */}
      </div>
    );
  }

  // Mendelegasikan pembuatan instance layout ke Factory Pattern
  return LayoutFactory.createLayout(isDesktop, props);
}
