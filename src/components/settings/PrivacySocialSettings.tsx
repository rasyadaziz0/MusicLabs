import React from 'react';
import { Eye, Music2, History } from 'lucide-react';
import { SectionHeader, ToggleRow } from './SettingsUI';

interface PrivacySocialSettingsProps {
  t: (key: string) => string;
  isPublic: boolean;
  setIsPublic: (enabled: boolean) => void;
  showNowPlaying: boolean;
  setShowNowPlaying: (enabled: boolean) => void;
  showRecentlyPlayed: boolean;
  setShowRecentlyPlayed: (enabled: boolean) => void;
}

export function PrivacySocialSettings({
  t,
  isPublic,
  setIsPublic,
  showNowPlaying,
  setShowNowPlaying,
  showRecentlyPlayed,
  setShowRecentlyPlayed,
}: PrivacySocialSettingsProps) {
  return (
    <>
      <SectionHeader title={t('settings.privacy_social')} />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
        <ToggleRow
          label={t('settings.public_profile')}
          description={t('settings.public_profile_desc')}
          icon={<Eye size={18} className="text-[#FA243C]" />}
          checked={isPublic}
          onChange={setIsPublic}
        />
        <ToggleRow
          label={t('settings.show_now_playing')}
          description={t('settings.show_now_playing_desc')}
          icon={<Music2 size={18} className="text-[#FA243C]" />}
          checked={showNowPlaying}
          onChange={setShowNowPlaying}
          hasBorder
        />
        <ToggleRow
          label={t('settings.show_recently_played')}
          description={t('settings.show_recently_played_desc')}
          icon={<History size={18} className="text-[#FA243C]" />}
          checked={showRecentlyPlayed}
          onChange={setShowRecentlyPlayed}
          hasBorder
        />
      </div>
    </>
  );
}
