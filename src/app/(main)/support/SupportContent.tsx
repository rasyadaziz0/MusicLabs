'use client';

import FeatureDisabled from '@/components/ui/FeatureDisabled';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useTranslation } from '@/context/LanguageContext';
import { Coffee, Heart } from 'lucide-react';

export default function SupportContent() {
  const { t } = useTranslation();
  const { flags } = useFeatureFlags();

  if (!flags.feature_tip) {
    return <FeatureDisabled />;
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">

        {/* Left Side: Call to Action */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Heart size={16} />
            <span>{t('support.subtitle')}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t('support.title')}
          </h1>

          <p className="text-lg text-white/70 leading-relaxed">
            {t('support.description')}
          </p>

          <div className="pt-4 space-y-4">
            <a
              href="https://kreate.gg/acadmusic"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(250,36,60,0.4)]"
            >
              <Coffee size={24} />
              {t('support.button')}
            </a>
          </div>
        </div>

        {/* Right Side: Leaderboard Iframe */}
        <div className="w-full md:w-[500px] lg:w-[550px] flex-shrink-0">
          <div className="glass rounded-2xl overflow-hidden shadow-2xl relative" style={{ height: '550px' }}>
            <div className="absolute inset-0 p-1">
              <iframe
                src="https://kreate.gg/leaderboard/widget/dfc494d6-e097-4005-bd08-037a36f77f57"
                className="w-full h-full border-none bg-transparent rounded-xl"
                title="Kreate Leaderboard"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
