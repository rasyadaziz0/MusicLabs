import React, { ReactNode } from 'react';
import PlayerBar from '../../player/PlayerBar';
import ConsoleCleaner from '@/components/ui/ConsoleCleaner';

export interface IMainLayoutProps {
  children: ReactNode;
  renderNavigation: () => ReactNode;
  isMobile: boolean;
}

export default function BaseLayout({
  children,
  renderNavigation,
  isMobile,
}: IMainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-void gradient-mesh relative">
      <ConsoleCleaner />
      {!isMobile && (
        <div className="absolute top-2 left-2 bottom-2 z-20 pointer-events-auto">
          {renderNavigation()}
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className={`flex-1 overflow-y-auto overflow-x-hidden relative z-0 ${!isMobile ? 'pb-36 md:pb-0' : 'pb-36'}`}>
          <div id="main-content-wrapper" className={`p-4 w-full transition-[padding] duration-300 ease-in-out ${!isMobile ? 'md:py-8 md:pr-8 md:pl-[288px] md:portrait:pl-[212px] pb-6 md:pb-8' : 'pb-6'}`}>
            {children}
          </div>
        </main>

        <div className={`absolute bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center ${!isMobile ? 'pb-0 md:pb-6 md:pl-[288px] md:portrait:pl-[212px]' : 'pb-0'}`}>
          <div className="pointer-events-auto w-full md:w-max md:max-w-full md:portrait:w-full md:portrait:px-3">
            <PlayerBar isMobile={isMobile} />
          </div>
        </div>

        {isMobile && renderNavigation()}
      </div>
    </div>
  );
}
