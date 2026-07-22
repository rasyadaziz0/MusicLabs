import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "goey-toast/styles.css";
import ConditionalProviders from "@/components/ConditionalProviders";
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
    default: "AcadMusic - Web Player",
    template: "%s | AcadMusic",
  },
  description: "Dengarkan jutaan lagu dengan lirik real-time, buat playlist, dan temukan musik baru dengan AI di AcadMusic.",
  keywords: ["music streaming", "streaming musik", "lirik lagu", "realtime lyrics", "music player", "youtube music alternative", "acadmusic", "rasyad azizan"],
  authors: [{ name: "Rasyad Azizan", url: "https://rasyadazizan.site" }],
  applicationName: "AcadMusic",
  generator: "Next.js",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AcadMusic",
  },
  openGraph: {
    type: "website",
    siteName: "AcadMusic",
    title: "AcadMusic - Web Player",
    description: "Dengarkan jutaan lagu dengan lirik real-time dan temukan musik baru dengan AI di AcadMusic.",
    locale: "id_ID",
    url: "https://music.rasyadazizan.site",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AcadMusic - Modern Music Streaming",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@acadmusic",
    creator: "@rasyadazizan",
    title: "AcadMusic - Web Player",
    description: "Dengarkan jutaan lagu dengan lirik real-time dan temukan musik baru dengan AI di AcadMusic.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <ConditionalProviders>
          {children}
        </ConditionalProviders>
        <Analytics />
        <GooeyToasterProvider />
      </body>
    </html>
  );
}

