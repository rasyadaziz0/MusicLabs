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
    <div className="flex h-screen overflow-hidden bg-void">
      {!isMobile && renderNavigation()}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto gradient-mesh pb-36 md:pb-0 relative z-0">
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-6 md:pb-8">
            {children}
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-0 md:pb-6 flex flex-col items-center">
          <div className="pointer-events-auto w-full md:w-max">
            <PlayerBar isMobile={isMobile} />
          </div>
        </div>

        {isMobile && renderNavigation()}
      </div>
    </div>
  );
}
