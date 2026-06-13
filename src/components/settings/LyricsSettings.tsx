import React from 'react';
import { Music2, Globe } from 'lucide-react';
import { SectionHeader, SettingsRow, ToggleRow } from './SettingsUI';

interface LyricsSettingsProps {
  t: (key: string) => string;
  lyricsFontSize: string;
  setLyricsFontSize: (size: string) => void;
  romanizationEnabled: boolean;
  setRomanizationEnabled: (enabled: boolean) => void;
  fontSizeOptions: { value: string; label: string }[];
}

export function LyricsSettings({
  t,
  lyricsFontSize,
  setLyricsFontSize,
  romanizationEnabled,
  setRomanizationEnabled,
  fontSizeOptions,
}: LyricsSettingsProps) {
  return (
    <>
      <SectionHeader title={t('settings.lyrics')} />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
        <SettingsRow label={t('settings.font_size')} icon={<Music2 size={18} className="text-[#FA243C]" />}>
          <div className="flex gap-2">
            {fontSizeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLyricsFontSize(opt.value)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${lyricsFontSize === opt.value
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white/60 border-white/10 hover:bg-white/5'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsRow>
        <ToggleRow
          label={t('settings.romanization')}
          description={t('settings.romanization_desc')}
          icon={<Globe size={18} className="text-[#FA243C]" />}
          checked={romanizationEnabled}
          onChange={setRomanizationEnabled}
          hasBorder
        />
      </div>
    </>
  );
}
