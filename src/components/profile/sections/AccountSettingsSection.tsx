'use client';

import Link from 'next/link';
import { User, Settings, LogOut, ChevronRight } from 'lucide-react';

interface AccountSettingsSectionProps {
  handleSignOut: () => void;
}

export function AccountSettingsSection({ handleSignOut }: AccountSettingsSectionProps) {
  return (
    <div data-animate className="px-5 md:px-8 mt-10 mb-8">
      <h2 className="text-[20px] font-bold text-white tracking-tight mb-4">Account</h2>
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
        <Link
          href="/profile/edit"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04]"
        >
          <span className="flex items-center gap-3 text-[15px] text-white/90">
            <User size={18} className="text-[#FA243C]" />
            Edit Profile
          </span>
          <ChevronRight size={18} className="text-white/20" />
        </Link>
        <button
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04]"
          onClick={() => {/* future */}}
        >
          <span className="flex items-center gap-3 text-[15px] text-white/90">
            <Settings size={18} className="text-[#FA243C]" />
            Preferences
          </span>
          <ChevronRight size={18} className="text-white/20" />
        </button>
        <button
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.06] transition-colors"
          onClick={handleSignOut}
        >
          <span className="flex items-center gap-3 text-[15px] text-[#FA243C] font-medium">
            <LogOut size={18} />
            Sign Out
          </span>
          <ChevronRight size={18} className="text-white/20" />
        </button>
      </div>
    </div>
  );
}
