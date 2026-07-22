'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useTranslation } from '@/context/LanguageContext';

import { ChevronLeft, Loader2, Save } from 'lucide-react';
import { gooeyToast as toast } from 'goey-toast';
import { supabase } from '@/lib/supabase/client';
import { DeleteAccountModal } from '@/components/profile/DeleteAccountModal';
import { ProfileRepository } from '@/lib/supabase/repositories/ProfileRepository';
import { HistoryRepository } from '@/lib/supabase/repositories/HistoryRepository';

// Import newly extracted section components
import { SearchDiscoverySettings } from '@/components/settings/SearchDiscoverySettings';
import { LyricsSettings } from '@/components/settings/LyricsSettings';
import { PrivacySocialSettings } from '@/components/settings/PrivacySocialSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AboutSettings } from '@/components/settings/AboutSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateProfile, signOut, loading } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { t, locale, setLocale } = useTranslation();
  // Privacy settings — initialize from global settings context
  const [isPublic, setIsPublic] = useState(settings.isPublic);
  const [showNowPlaying, setShowNowPlaying] = useState(settings.showNowPlaying);
  const [showRecentlyPlayed, setShowRecentlyPlayed] = useState(settings.showRecentlyPlayed);

  // Lyrics settings
  const [lyricsFontSize, setLyricsFontSize] = useState<string>(settings.lyricsFontSize);
  const [romanizationEnabled, setRomanizationEnabled] = useState(settings.romanizationEnabled);

  // Search Settings
  const [searchRegion, setSearchRegion] = useState('ID');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      const fetchProfile = async () => {
        const data = await ProfileRepository.getInstance().getProfile(user.id);
        if (data) {
          setIsPublic(data.is_public ?? true);
          setShowNowPlaying(data.show_now_playing ?? true);
          setShowRecentlyPlayed(data.show_recently_played ?? true);
          setLyricsFontSize(data.lyrics_font_size || 'medium');
          setRomanizationEnabled(data.romanization_enabled ?? true);
        }
        setIsFetching(false);
      };
      fetchProfile();
    } else {
      setIsFetching(false);
    }

    const savedRegion = localStorage.getItem('searchRegion');
    if (savedRegion) {
      setSearchRegion(savedRegion);
    }
  }, [user, loading, router]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Save region locally
    localStorage.setItem('searchRegion', searchRegion);

    if (!user) {
      toast.success('Settings saved locally!', {
        description: 'Your preferences have been updated on this device.'
      });
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await updateProfile({
      isPublic,
      showNowPlaying,
      showRecentlyPlayed,
      lyricsFontSize,
      romanizationEnabled,
    });

    if (updateError) {
      setError(updateError);
      setIsSubmitting(false);
    } else {
      // Update global settings context so changes take effect immediately
      updateSettings({
        isPublic,
        showNowPlaying,
        showRecentlyPlayed,
        lyricsFontSize: lyricsFontSize as 'small' | 'medium' | 'large',
        romanizationEnabled,
      });
      toast.success('Profile updated!', {
        description: 'Your changes have been saved and synced successfully.'
      });
      router.push('/profile');
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    setIsClearingHistory(true);
    try {
      await new HistoryRepository(supabase).clearHistory(user.id);
      toast.success('Listening history cleared!', {
        description: 'Your recent tracks have been removed.'
      });
    } catch {
      toast.error('Failed to clear history.');
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await ProfileRepository.getInstance().deleteAccount(user.id);
      await signOut();
      router.push('/');
      toast.success('Account deleted.');
    } catch {
      toast.error('Failed to delete account. Please try again.');
    }
  };

  if (loading || !user || isFetching) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-white/50" size={32} />
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  return (
    <div className="pt-2 max-w-2xl mx-auto px-5 md:px-8 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('settings.title')}</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {t('settings.save')}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">
          {error}
        </div>
      )}



      {/* ═══════════════════════════════════════════════════════════
          SECTION 2.5: SEARCH
         ═══════════════════════════════════════════════════════════ */}
      <SearchDiscoverySettings
        t={t}
        locale={locale}
        setLocale={setLocale}
        searchRegion={searchRegion}
        setSearchRegion={setSearchRegion}
      />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: LYRICS
         ═══════════════════════════════════════════════════════════ */}
      <LyricsSettings
        t={t}
        lyricsFontSize={lyricsFontSize}
        setLyricsFontSize={setLyricsFontSize}
        romanizationEnabled={romanizationEnabled}
        setRomanizationEnabled={setRomanizationEnabled}
        fontSizeOptions={fontSizeOptions}
      />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: PRIVACY & SOCIAL
         ═══════════════════════════════════════════════════════════ */}
      <PrivacySocialSettings
        t={t}
        isPublic={isPublic}
        setIsPublic={setIsPublic}
        showNowPlaying={showNowPlaying}
        setShowNowPlaying={setShowNowPlaying}
        showRecentlyPlayed={showRecentlyPlayed}
        setShowRecentlyPlayed={setShowRecentlyPlayed}
      />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: ABOUT
         ═══════════════════════════════════════════════════════════ */}
      <AboutSettings t={t} />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: ACCOUNT
         ═══════════════════════════════════════════════════════════ */}
      <AccountSettings
        t={t}
        user={user}
        handleClearHistory={handleClearHistory}
        isClearingHistory={isClearingHistory}
        handleSignOut={async () => { await signOut(); router.push('/'); }}
        setShowDeleteModal={setShowDeleteModal}
      />
      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />

      {/* Inline styles for settings inputs */}
      <style jsx global>{`
        .settings-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .settings-input:focus {
          border-color: rgba(255,255,255,0.2);
        }
        .settings-input::placeholder {
          color: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}


