'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { ArtworkColorsProvider } from '@/context/ArtworkColorsContext';
import { LanguageProvider } from '@/context/LanguageContext';
import QueryProvider from '@/context/QueryProvider';
import PWARegistration from '@/components/PWARegistration';
import YouTubePlayerMount from '@/components/YouTubePlayerMount';
import { LiquidGlassFilters } from '@/components/ui/LiquidGlass';

/**
 * ConditionalProviders — Wraps children with the full app provider stack,
 * EXCEPT when the current route starts with `/embed`.
 *
 * Embed routes are lightweight, auth-free widgets that create their own
 * isolated YouTube player. Loading PlayerProvider + YouTubePlayerMount
 * would conflict with the embed's own player and bloat the bundle.
 */
export default function ConditionalProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEmbed = pathname.startsWith('/embed');

  if (isEmbed) {
    // Embed pages: minimal shell — no providers, no PWA, no global YT player
    return <>{children}</>;
  }

  // Main app: full provider stack
  return (
    <>
      <LiquidGlassFilters />
      <PWARegistration />
      <QueryProvider>
        <LanguageProvider>
          <AuthProvider>
            <SettingsProvider>
              <PlayerProvider>
                <ArtworkColorsProvider>
                  {children}
                  <YouTubePlayerMount />
                </ArtworkColorsProvider>
              </PlayerProvider>
            </SettingsProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryProvider>
    </>
  );
}
