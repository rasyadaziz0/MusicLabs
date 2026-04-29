'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Library, PlusSquare, Heart, Music2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLibraryPlaylists } from '@/hooks/useMusicLibrary';
import { useAuth } from '@/context/AuthContext';
import { FormEvent, useRef } from 'react';
import { encodeQuery } from '@/lib/utils/searchEncode';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Library, label: 'Library', href: '/library' },
];

const secondaryItems = [
  { icon: PlusSquare, label: 'Create Playlist', href: '/playlist/create' },
  { icon: Heart, label: 'Liked Songs', href: '/library/liked' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { data: playlists = [], isLoading } = useLibraryPlaylists();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchInputRef.current?.value.trim() ?? '';
    if (!q) return;
    router.push(`/search?q=${encodeQuery(q)}`);
  };

  return (
    <div className="hidden md:flex w-64 bg-deep h-full flex-col border-r border-white/5 pt-4 pb-4">
      {/* Logo */}
      <div className="px-5 mb-4">
        <Link href="/" className="flex items-center gap-2">
          <Music2 size={22} className="text-primary" />
          <span className="text-lg font-display font-bold tracking-tight text-white">
            MusicLabs
          </span>
        </Link>
      </div>

      {/* Search Input — macOS style */}
      <div className="px-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search"
            className="w-full bg-white/[0.06] border border-white/[0.04] rounded-md py-[5px] pl-8 pr-3 text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/10 focus:bg-white/[0.09] transition-all"
            suppressHydrationWarning
            data-lpignore="true"
            data-1p-ignore
          />
        </form>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-5">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 mx-2 rounded-md transition-colors",
                  isActive
                    ? "bg-white/10 text-primary font-bold"
                    : "text-white/80 hover:bg-white/5 font-medium"
                )}
              >
                <Icon size={18} className={isActive ? "text-primary" : "text-primary/70"} />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div>
          <p className="px-5 text-[11px] font-bold text-muted/70 mb-1.5 uppercase tracking-widest">
            Library
          </p>
          <div className="space-y-0.5">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 mx-2 rounded-md transition-colors",
                    isActive
                      ? "bg-white/10 text-primary font-bold"
                      : "text-white/80 hover:bg-white/5 font-medium"
                  )}
                >
                  <Icon size={18} className={isActive ? "text-primary" : "text-primary/70"} />
                  <span className="text-[13px]">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-5 text-[11px] font-bold text-muted/70 mb-1.5 uppercase tracking-widest">
            Playlists
          </p>
          {!user ? (
            <p className="px-5 text-[13px] text-muted">
              Login dulu buat lihat playlist lu.
            </p>
          ) : isLoading ? (
            <div className="space-y-1">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-8 mx-2 rounded-md bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : playlists.length > 0 ? (
            <div className="space-y-0.5">
              {playlists.slice(0, 15).map((playlist) => {
                const href = `/playlist/${playlist.id}`;
                const isActive = pathname === href;

                return (
                  <Link
                    key={playlist.id}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-1.5 mx-2 rounded-md transition-colors",
                      isActive
                        ? "bg-white/10 text-primary font-bold"
                        : "text-white/80 hover:bg-white/5 font-medium"
                    )}
                  >
                    <Music2 size={16} className={isActive ? "text-primary" : "text-primary/70"} />
                    <span className="truncate text-[13px]">{playlist.name}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-2">
              <Link
                href="/playlist/create"
                className="flex items-center justify-center rounded-md border border-dashed border-white/10 px-4 py-2 text-[13px] text-muted transition-colors hover:border-primary/40 hover:text-white"
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
