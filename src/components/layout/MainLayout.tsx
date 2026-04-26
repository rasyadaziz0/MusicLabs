'use client';

import { Suspense } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import PlayerBar from '../player/PlayerBar';
import MobileNav from './MobileNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-void">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main className="flex-1 overflow-y-auto gradient-mesh pb-36 md:pb-0 relative z-0">
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-6 md:pb-8">
            {children}
          </div>
        </main>
        <PlayerBar />
        <MobileNav />
      </div>
    </div>
  );
}
