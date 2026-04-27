'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, PlusSquare, Heart, Music2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLibraryPlaylists } from '@/hooks/useMusicLibrary';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Library', href: '/library' },
];

const secondaryItems = [
  { icon: PlusSquare, label: 'Create Playlist', href: '/playlist/create' },
  { icon: Download, label: 'Import Spotify', href: '/import/spotify' },
  { icon: Heart, label: 'Liked Songs', href: '/library/liked' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { data: playlists = [], isLoading } = useLibraryPlaylists();

  return (
    <div className="hidden md:flex w-64 bg-surface h-full flex-col border-r border-white/5">
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

        <div className="border-t border-white/5 pt-4">
          <p className="px-4 text-xs font-bold uppercase tracking-widest text-muted/50 mb-3">
            Playlists
          </p>
          {!user ? (
            <p className="px-4 text-sm text-muted">
              Login dulu buat lihat playlist kamu.
            </p>
          ) : isLoading ? (
            <div className="space-y-2 px-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-10 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : playlists.length > 0 ? (
            <div className="space-y-1">
              {playlists.slice(0, 8).map((playlist) => {
                const href = `/playlist/${playlist.id}`;
                const isActive = pathname === href;

                return (
                  <Link
                    key={playlist.id}
                    href={href}
                    className={cn(
                      'mx-2 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-muted hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Music2 size={16} />
                    </span>
                    <span className="truncate font-medium">{playlist.name}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-4">
              <Link
                href="/playlist/create"
                className="flex items-center justify-center rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-muted transition-colors hover:border-primary/40 hover:text-white"
              >
                Buat playlist pertama
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
