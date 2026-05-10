'use client';

import { useAuth } from '@/context/AuthContext';
import { Search, Bell, User as UserIcon, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useRef } from 'react';
import { decodeQuery, encodeQuery } from '@/lib/utils/searchEncode';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchPage = pathname === '/search';
  const currentQuery = isSearchPage ? decodeQuery(searchParams.get('q') ?? '') : '';
  const avatarUrlRaw = user?.user_metadata?.avatar_url as string | undefined;
  const avatarUrl = avatarUrlRaw?.trim().replace(/^`+|`+$/g, '');

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchInputRef.current?.value.trim() ?? '';
    if (!q) return;
    router.push(`/search?q=${encodeQuery(q)}`);
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 bg-void/50 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => router.forward()}
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-muted hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-void" />
        </button>

        {user ? (
          <div className="flex items-center gap-3 bg-white/5 pl-1 pr-3 py-1 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10">
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt={user.user_metadata.name || 'User'} 
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <UserIcon size={16} />
                </div>
              )}
            </div>
            <span className="text-sm font-medium hidden sm:block">
              {user.user_metadata?.name?.split(' ')[0]}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                signOut();
              }}
              className="ml-2 p-1 text-muted hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform text-sm"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
