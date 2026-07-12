import Image from 'next/image';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface HomeHeaderProps {
  user: User | null;
  isProfileOpen: boolean;
  setIsProfileOpen: (isOpen: boolean) => void;
  handleSignOut: () => void;
}

export function HomeHeader({ user, isProfileOpen, setIsProfileOpen, handleSignOut }: HomeHeaderProps) {
  return (
    <div className="px-2">
      <header className="flex items-center justify-between">
        <h1 className="text-[34px] font-bold tracking-tight text-white mb-2">Home</h1>
        {user && (
          <div className="relative z-50 mb-2 lg:hidden">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full overflow-hidden bg-white/10 relative border border-white/10"
            >
              {user.user_metadata?.avatar_url ? (
                <Image src={user.user_metadata.avatar_url.trim().replace(/^`+|`+$/g, '')} alt="User" fill sizes="36px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FA243C]" />
              )}
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 top-11 w-48 bg-[#2c2c2e] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden py-1">
                  <div className="px-4 py-2 border-b border-white/5 mb-1">
                    <p className="text-[13px] font-semibold text-white/90 truncate">{user.user_metadata?.name || 'User'}</p>
                    <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="w-full text-left px-4 py-2 text-[13px] text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-[13px] text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>
      <div className="h-[1px] w-full bg-white/10 mt-2" />
    </div>
  );
}
