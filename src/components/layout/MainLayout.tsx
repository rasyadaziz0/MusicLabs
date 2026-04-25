'use client';

import Sidebar from './Sidebar';
import Header from './Header';
import PlayerBar from '../player/PlayerBar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-void">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto gradient-mesh">
          <div className="p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        <PlayerBar />
      </div>
    </div>
  );
}
