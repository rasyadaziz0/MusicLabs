import React from 'react';
import { History, LogOut, Trash2, Loader2 } from 'lucide-react';
import { SectionHeader } from './SettingsUI';
import { User } from '@supabase/supabase-js';

interface AccountSettingsProps {
  t: (key: string) => string;
  user: User;
  handleClearHistory: () => void;
  isClearingHistory: boolean;
  handleSignOut: () => void;
  setShowDeleteModal: (show: boolean) => void;
}

export function AccountSettings({
  t,
  user,
  handleClearHistory,
  isClearingHistory,
  handleSignOut,
  setShowDeleteModal,
}: AccountSettingsProps) {
  return (
    <>
      <SectionHeader title={t('settings.account')} />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
        {/* Connected Accounts */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <span className="text-[14px] text-white/90 font-medium">Google</span>
              <p className="text-[12px] text-white/40">{user?.email}</p>
            </div>
          </div>
          <span className="text-[12px] text-green-400/80 font-medium bg-green-400/10 px-2.5 py-1 rounded-full">Connected</span>
        </div>

        {/* Clear Listening History */}
        <button
          onClick={handleClearHistory}
          disabled={isClearingHistory}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04]"
        >
          <span className="flex items-center gap-3 text-[14px] text-white/80">
            <History size={18} className="text-orange-400" />
            {isClearingHistory ? 'Clearing...' : t('settings.clear_history')}
          </span>
          {isClearingHistory && <Loader2 size={16} className="animate-spin text-white/40" />}
        </button>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] text-[14px] text-white/80"
        >
          <LogOut size={18} className="text-[#FA243C]" />
          {t('settings.sign_out')}
        </button>

        {/* Delete Account */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/[0.06] transition-colors text-[14px] text-red-400 font-medium"
        >
          <Trash2 size={18} />
          {t('settings.delete_account')}
        </button>
      </div>
    </>
  );
}
