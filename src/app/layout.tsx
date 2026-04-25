import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import QueryProvider from "@/context/QueryProvider";
import PWARegistration from "@/components/PWARegistration";

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
  title: "MusicLabs - Spotify Clone",
  description: "Your personal music streaming app built with Next.js and Supabase",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MusicLabs",
  },
};

export const viewport: Viewport = {
  themeColor: "#2F2FE4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    >
      <body className="min-h-full bg-void text-white selection:bg-primary/30">
        <PWARegistration />
        <QueryProvider>
          <AuthProvider>
            <PlayerProvider>
              {children}
              {/* Hidden YouTube Player Container */}
              <div id="youtube-player-container" className="fixed bottom-0 right-0 w-[1px] h-[1px] opacity-0 pointer-events-none -z-50" />
            </PlayerProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
