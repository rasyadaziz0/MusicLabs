'use client';

import PWARegistration from '@/components/PWARegistration';
import YouTubePlayerMount from '@/components/YouTubePlayerMount';
import { LiquidGlassFilters } from '@/components/ui/LiquidGlass';
import { ArtworkColorsProvider } from '@/context/ArtworkColorsContext';
import { AuthProvider } from '@/context/AuthContext';
import { FeatureFlagsProvider } from '@/context/FeatureFlagsContext';
import { ImportProvider } from '@/context/ImportContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { PlayerProvider } from '@/context/PlayerContext';
import QueryProvider from '@/context/QueryProvider';
import { SettingsProvider } from '@/context/SettingsContext';
import { usePathname } from 'next/navigation';

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
        <FeatureFlagsProvider>
          <LanguageProvider>
            <AuthProvider>
              <SettingsProvider>
                <ImportProvider>
                  <PlayerProvider>
                    <ArtworkColorsProvider>
                      {children}
                      <YouTubePlayerMount />
                    </ArtworkColorsProvider>
                  </PlayerProvider>
                </ImportProvider>
              </SettingsProvider>
            </AuthProvider>
          </LanguageProvider>
        </FeatureFlagsProvider>
      </QueryProvider>
    </>
  );
}
