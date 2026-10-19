'use client';

import { GlassBar } from '@/components/ui/LiquidGlass';
import { StyleHelper } from '@/lib/utils/StyleHelper';
import { Home, Library, Radio, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useTranslation } from '@/context/LanguageContext';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

const navItems = [
  { icon: Home, key: 'home', href: '/' },
  { icon: Radio, key: 'radio', href: '/radio' },
  { icon: Library, key: 'library', href: '/library' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { flags } = useFeatureFlags();
  const { t } = useTranslation();

  const activeNavItems = navItems.filter((item) => {
    if (item.href === '/radio' && !flags.feature_radio) return false;
    return true;
  });

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 flex items-center gap-2">
      <GlassBar className="flex-1 rounded-full h-[68px] shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <div className="flex h-full items-center justify-around px-2">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={StyleHelper.cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                  isActive
                    ? "text-[#fc3c44] scale-105"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Icon size={24} className={isActive ? "fill-[#fc3c44]" : ""} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{t(`sidebar.${item.key}`)}</span>
              </Link>
            );
          })}
        </div>
      </GlassBar>

      {/* Search FAB */}
      <GlassBar className="w-[68px] h-[68px] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <Link 
          href="/search" 
          className={StyleHelper.cn(
            "w-full h-full flex items-center justify-center transition-all",
            pathname === '/search' ? "text-[#fc3c44]" : "text-white/60 hover:text-white"
          )}
        >
          <Search size={28} strokeWidth={pathname === '/search' ? 2.5 : 1.5} />
        </Link>
      </GlassBar>
    </div>
  );
}
