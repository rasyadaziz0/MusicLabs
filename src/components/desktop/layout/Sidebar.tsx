'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutGrid, Radio, Clock, Mic, SquareStack, Music, UserSquare, Search, ChevronDown, ChevronRight, Pin, Star, LogOut, PlusSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLibraryPlaylists } from '@/hooks/useMusicLibrary';
import { useDiscoverWeekly } from '@/hooks/useDiscoverWeekly';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';

import IdentifyButton from '../../identify/IdentifyButton';

const navItems = [
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Home, label: 'Home', href: '/' },
  { icon: Radio, label: 'Radio', href: '/radio' },
];

const libraryItems = [
  { icon: Clock, label: 'Recently Added', href: '/library/recent' },
  { icon: PlusSquare, label: 'New Playlist', href: '/playlist/create' },
  // Artists position was here, we will inject Discover Weekly here dynamically
  { icon: SquareStack, label: 'Albums', href: '/library/albums' },
  { icon: Music, label: 'Songs', href: '/library/songs' },
  { icon: UserSquare, label: 'Made for You', href: '/made-for-you' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: playlists = [] } = useLibraryPlaylists();
  const [isPinsOpen, setIsPinsOpen] = useState(true);

  const { hasPlaylist, playlistId, generatedAt } = useDiscoverWeekly();
  const [hasSeenLatest, setHasSeenLatest] = useState(true);

  const discoverWeeklyHref = playlistId ? `/playlist/${playlistId}` : '#';
  const isDiscoverWeeklyActive = pathname === discoverWeeklyHref;

  useEffect(() => {
    if (!generatedAt) return;
    const seenAt = localStorage.getItem('discover_weekly_seen_at');
    if (seenAt === generatedAt) {
      setHasSeenLatest(true);
    } else {
      setHasSeenLatest(false);
    }
  }, [generatedAt]);

  useEffect(() => {
    if (isDiscoverWeeklyActive && generatedAt && !hasSeenLatest) {
      localStorage.setItem('discover_weekly_seen_at', generatedAt);
      setHasSeenLatest(true);
    }
  }, [isDiscoverWeeklyActive, generatedAt, hasSeenLatest]);

  // Check if it was updated in the last 2 days AND the user hasn't seen it yet
  const isWithinTwoDays = generatedAt && (Date.now() - new Date(generatedAt).getTime() < 2 * 24 * 60 * 60 * 1000);
  const isRecentlyUpdated = isWithinTwoDays && !hasSeenLatest;

  const isGuest = !user;

  const navLinkClass = (isActive: boolean) => cn(
    "flex items-center gap-3 px-3 py-1.5 mx-2 rounded-md transition-colors text-[13px] font-medium border",
    isActive
      ? "bg-[#FA243C]/10 text-[#FA243C] border-[#FA243C]"
      : "text-white/80 hover:bg-white/5 border-transparent"
  );

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="hidden md:flex w-64 bg-[#1c1c1e] h-full flex-col border-r border-white/5 pt-4 pb-4">
      {/* Logo */}
      <div className="px-6 mb-6 flex items-center gap-1.5">
        <span className="text-[20px] font-bold tracking-tight text-white mb-[2px]">AcadMusic</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 scrollbar-hide">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href} className={navLinkClass(isActive)}>
                <Icon size={18} className="text-[#FA243C]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <IdentifyButton variant="sidebar" />
        </div>

        {/* Library — only show for logged-in users */}
        {!isGuest && (
          <div>
            <p className="px-5 text-[11px] font-semibold text-muted/70 mb-2">Library</p>
            <div className="space-y-0.5">
              {/* Pins Section */}
              <div className="mx-2 flex flex-col mb-1">
                <button
                  onClick={() => setIsPinsOpen(!isPinsOpen)}
                  className="flex items-center gap-1.5 px-1 py-1 text-white/80 hover:bg-white/5 rounded-md w-full text-left transition-colors group"
                >
                  <div className="text-white/40 group-hover:text-white/80">
                    {isPinsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                  <Pin size={16} className="text-[#FA243C]" />
                  <span className="text-[13px] font-medium ml-1">Pins</span>
                </button>
              </div>

              {/* Item sebelum Artists */}
              {libraryItems.slice(0, 2).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.label} href={item.href} className={navLinkClass(isActive)}>
                    <Icon size={18} className="text-[#FA243C]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Discover Weekly menggantikan Artists JIKA sudah ada. Jika belum, tampilkan Artists. */}
              {hasPlaylist ? (
                <Link key="discover-weekly" href={discoverWeeklyHref} className={navLinkClass(isDiscoverWeeklyActive)}>
                  <Sparkles size={18} className={isRecentlyUpdated ? "text-white" : "text-[#FA243C]"} />
                  <span className={isRecentlyUpdated ? "text-white font-bold" : ""}>
                    Discover Weekly
                    {isRecentlyUpdated && <span className="ml-2 text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                  </span>
                </Link>
              ) : (
                <Link key="Artists" href="/library/artists" className={navLinkClass(pathname === '/library/artists')}>
                  <Mic size={18} className="text-[#FA243C]" />
                  <span>Artists</span>
                </Link>
              )}

              {/* Item setelah Artists (Albums, Songs, Made for You) */}
              {libraryItems.slice(2).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.label} href={item.href} className={navLinkClass(isActive)}>
                    <Icon size={18} className="text-[#FA243C]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Playlists — only show for logged-in users */}
        {!isGuest && (
          <div>
            <p className="px-5 text-[11px] font-semibold text-muted/70 mt-4 mb-2">Playlists</p>
            <div className="space-y-0.5">
              <Link href="/library/playlists" className={navLinkClass(pathname === '/library/playlists')}>
                <LayoutGrid size={18} className="text-[#FA243C]" />
                <span>All Playlists</span>
              </Link>
              <Link href="/library/liked" className={navLinkClass(pathname === '/library/liked')}>
                <Star size={18} className="text-[#FA243C]" />
                <span>Favourite Songs</span>
              </Link>
              {playlists
                .filter(playlist => playlist.name !== 'Discover Weekly')
                .map(playlist => (
                  <Link key={playlist.id} href={`/playlist/${playlist.id}`} className={navLinkClass(pathname === `/playlist/${playlist.id}`)}>
                    <Music size={18} className="text-[#FA243C]" />
                    <span className="truncate">{playlist.name}</span>
                  </Link>
              ))}
            </div>
          </div>
        )}

        {/* Guest — Sign In prompt in sidebar body */}
        {isGuest && (
          <div className="px-4 mt-2">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4">
              <p className="text-[13px] text-white/70 leading-relaxed mb-3">
                Sign in to create playlists, save your favorite songs, and more.
              </p>
              <Link
                href="/login"
                className="block w-full text-center py-2 rounded-lg bg-[#FA243C] text-white text-[13px] font-semibold hover:bg-[#FA243C]/90 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Footer Profile & Links */}
      {user ? (
        <div className="flex items-center gap-3 px-4 group">
          <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 relative flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <Image src={user.user_metadata.avatar_url.trim().replace(/^`+|`+$/g, '')} alt="User" fill sizes="36px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FA243C]" />
              )}
            </div>
            <span className="text-[13px] font-semibold text-white/90 flex-1 truncate hover:text-white transition-colors">{user.user_metadata?.name || 'User'}</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="p-1.5 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
