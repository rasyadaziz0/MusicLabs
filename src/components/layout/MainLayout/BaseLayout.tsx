import Footer from '@/components/layout/Footer';
import ConsoleCleaner from '@/components/ui/ConsoleCleaner';
import { ReactNode } from 'react';
import PlayerBar from '../../player/PlayerBar';

export interface IMainLayoutProps {
  children: ReactNode;
  renderDesktopNav: () => ReactNode;
  renderMobileNav: () => ReactNode;
}

export default function BaseLayout({
  children,
  renderDesktopNav,
  renderMobileNav,
}: IMainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-void gradient-mesh relative">
      <ConsoleCleaner />
      {/* Desktop Sidebar — hidden on mobile */}
      <div className="absolute top-2 left-2 bottom-2 z-20 pointer-events-auto hidden md:block">
        {renderDesktopNav()}
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 pb-36 md:pb-36">
          <div
            id="main-content-wrapper"
            className="p-4 w-full transition-[padding] duration-300 ease-in-out pb-6 md:py-8 md:pr-8 md:pl-[288px] md:portrait:pl-[212px] md:pb-8"
          >
            {children}
            <Footer />
          </div>
        </main>

        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center pb-0 md:pb-6 md:pl-[288px] md:portrait:pl-[212px]">
          <div className="pointer-events-auto w-full md:w-max md:max-w-full md:portrait:w-full md:portrait:px-3">
            <PlayerBar />
          </div>
        </div>

        {/* Mobile Navigation — hidden on desktop */}
        <div className="block md:hidden">
          {renderMobileNav()}
        </div>
      </div>
    </div>
  );
}
