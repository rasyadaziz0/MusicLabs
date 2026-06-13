import React from 'react';
import { Globe } from 'lucide-react';
import { SectionHeader, SettingsRow } from './SettingsUI';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface SearchDiscoverySettingsProps {
  t: (key: string) => string;
  locale: string;
  setLocale: (locale: string) => void;
  searchRegion: string;
  setSearchRegion: (region: string) => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'jp', label: '日本語 (Japanese)' },
  { value: 'kr', label: '한국어 (Korean)' },
];

const REGION_OPTIONS = [
  { value: 'ID', label: 'Indonesia (ID)' },
  { value: 'US', label: 'United States (US)' },
  { value: 'JP', label: 'Japan (JP)' },
  { value: 'KR', label: 'South Korea (KR)' },
  { value: 'GB', label: 'United Kingdom (GB)' },
  { value: 'MY', label: 'Malaysia (MY)' },
  { value: 'SG', label: 'Singapore (SG)' },
  { value: 'TH', label: 'Thailand (TH)' },
  { value: 'PH', label: 'Philippines (PH)' },
  { value: 'AU', label: 'Australia (AU)' },
  { value: 'CA', label: 'Canada (CA)' },
  { value: 'FR', label: 'France (FR)' },
  { value: 'DE', label: 'Germany (DE)' },
  { value: 'IT', label: 'Italy (IT)' },
  { value: 'ES', label: 'Spain (ES)' },
  { value: 'BR', label: 'Brazil (BR)' },
  { value: 'MX', label: 'Mexico (MX)' },
  { value: 'IN', label: 'India (IN)' },
];

export function SearchDiscoverySettings({
  t,
  locale,
  setLocale,
  searchRegion,
  setSearchRegion,
}: SearchDiscoverySettingsProps) {
  return (
    <>
      <SectionHeader title={t('settings.search_discovery')} />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] mb-8">
        <SettingsRow label={t('settings.ui_language')} icon={<Globe size={18} className="text-[#FA243C]" />}>
          <div className="w-[200px]">
            <CustomSelect
              value={locale}
              options={LANGUAGE_OPTIONS}
              onChange={setLocale}
            />
          </div>
        </SettingsRow>
        <SettingsRow label={t('settings.search_region')} icon={<Globe size={18} className="text-[#FA243C]" />}>
          <div className="w-[200px]">
            <CustomSelect
              value={searchRegion}
              options={REGION_OPTIONS}
              onChange={setSearchRegion}
            />
          </div>
        </SettingsRow>
      </div>
    </>
  );
}

