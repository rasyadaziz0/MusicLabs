'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, Radio, AudioLines } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassBar } from '@/components/ui/LiquidGlass';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Radio, label: 'Radio', href: '/radio' },
  // { icon: AudioLines, label: 'Identify', href: '/identify' },
  { icon: Library, label: 'Library', href: '/library' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 flex items-center gap-2">
      <GlassBar className="flex-1 rounded-full h-[68px] shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <div className="flex h-full items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const isIdentify = item.label === 'Identify';

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                  isIdentify && !isActive
                    ? "text-[#FA243C]/70 hover:text-[#FA243C]"
                    : isActive
                      ? "text-[#fc3c44] scale-105"
                      : "text-white/60 hover:text-white"
                )}
              >
                <Icon size={24} className={isActive ? "fill-[#fc3c44]" : ""} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </GlassBar>

      {/* Search FAB */}
      <GlassBar className="w-[68px] h-[68px] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <Link 
          href="/search" 
          className={cn(
            "w-full h-full flex items-center justify-center transition-all",
            pathname === '/search' ? "text-[#fc3c44]" : "text-white/60 hover:text-white"
          )}
        >
          <Search size={28} strokeWidth={pathname === '/search' ? 2.5 : 1.5} />
        </Link>
      </GlassBar>
    </div>
  );
}
