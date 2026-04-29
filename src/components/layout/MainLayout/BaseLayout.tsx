import React, { ReactNode, Suspense } from 'react';
import Header from '../Header';
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
        {/* Desktop: PlayerBar at top as header. Mobile: original Header stays */}
        <div className="hidden md:block">
          <PlayerBar />
        </div>
        <div className="md:hidden">
          <Suspense fallback={null}>
            <Header />
          </Suspense>
        </div>

        <main className="flex-1 overflow-y-auto gradient-mesh pb-36 md:pb-0 relative z-0">
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-6 md:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile: PlayerBar stays at bottom */}
        <div className="md:hidden">
          <PlayerBar />
        </div>

        {isMobile && renderNavigation()}
      </div>
    </div>
  );
}
