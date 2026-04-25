'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, PlusSquare, Heart, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Library', href: '/library' },
];

const secondaryItems = [
  { icon: PlusSquare, label: 'Create Playlist', href: '/playlist/create' },
  { icon: Heart, label: 'Liked Songs', href: '/library/liked' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-surface h-full flex flex-col border-r border-white/5">
      <div className="p-6 mb-4">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Music2 size={32} strokeWidth={2.5} />
          <span className="text-2xl font-display font-bold tracking-tight text-white">
            MusicLabs
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={22} className={cn("transition-transform group-hover:scale-110", isActive && "text-white")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-8 pb-4">
          <p className="px-4 text-xs font-bold uppercase tracking-widest text-muted/50 mb-4">
            Your Collection
          </p>
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-muted hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={22} className="transition-transform group-hover:scale-110" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4">
        <div className="bg-dark-navy p-4 rounded-2xl border border-white/5">
          <p className="text-sm font-bold mb-1">Go Premium</p>
          <p className="text-xs text-muted mb-3">Listen without limits and ads.</p>
          <button className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
