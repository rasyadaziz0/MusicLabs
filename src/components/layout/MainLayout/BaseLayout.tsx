import React, { ReactNode } from 'react';
import PlayerBar from '../../player/PlayerBar';

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
      {!isMobile && (
        <div className="absolute top-2 left-2 bottom-2 z-20 pointer-events-auto">
          {renderNavigation()}
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-36 md:pb-0 relative z-0">
          <div id="main-content-wrapper" className="p-4 md:py-8 md:pr-8 md:pl-[288px] w-full pb-6 md:pb-8 transition-[padding] duration-300 ease-in-out">
            {children}
          </div>
        </main>

        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none pb-0 md:pb-6 flex flex-col items-center md:pl-[288px]">
          <div className="pointer-events-auto w-full md:w-max">
            <PlayerBar isMobile={isMobile} />
          </div>
        </div>

        {isMobile && renderNavigation()}
      </div>
    </div>
  );
}
