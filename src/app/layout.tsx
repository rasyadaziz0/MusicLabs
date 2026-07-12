import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "goey-toast/styles.css";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { ArtworkColorsProvider } from "@/context/ArtworkColorsContext";
import { LanguageProvider } from "@/context/LanguageContext";
import QueryProvider from "@/context/QueryProvider";
import PWARegistration from "@/components/PWARegistration";
import YouTubePlayerMount from "@/components/YouTubePlayerMount";
import { LiquidGlassFilters } from "@/components/ui/LiquidGlass";
import { Analytics } from "@vercel/analytics/react";
import GooeyToasterProvider from "@/components/GooeyToasterProvider";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://music.rasyadazizan.site"),
  title: {
    default: "AcadMusic - Streaming Musik Gratis dengan Lirik",
    template: "%s | AcadMusic",
  },
  description: "Dengarkan jutaan lagu gratis dengan lirik, playlist kolaboratif, dan rekomendasi AI. Streaming musik tanpa batas di AcadMusic.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AcadMusic",
  },
  openGraph: {
    type: "website",
    siteName: "AcadMusic",
    title: "AcadMusic - Streaming Musik Gratis dengan Lirik",
    description: "Dengarkan jutaan lagu gratis dengan lirik, playlist kolaboratif, dan rekomendasi AI.",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "AcadMusic - Streaming Musik Gratis",
    description: "Dengarkan jutaan lagu gratis dengan lirik real-time, playlist kolaboratif, dan rekomendasi AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#e02929ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-void text-white selection:bg-primary/30 select-none overflow-x-hidden" suppressHydrationWarning>
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
        <Analytics />
        <GooeyToasterProvider />
      </body>
    </html>
  );
}
