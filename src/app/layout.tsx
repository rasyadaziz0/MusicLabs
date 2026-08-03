import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "goey-toast/styles.css";
import ConditionalProviders from "@/components/ConditionalProviders";
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
    default: "AcadMusic - Apple Music Clone Portfolio by Rasyad",
    template: "%s | AcadMusic Portfolio",
  },
  description: "A modern Apple Music clone web application built with Next.js, Supabase, and Cloudflare Edge Runtime. A developer portfolio project by Rasyad Azizan featuring YouTube Music API integration and realtime lyrics.",
  keywords: ["apple music clone", "music streaming app", "next.js portfolio", "rasyad azizan", "acadmusic clone", "developer portfolio", "supabase music app", "realtime lyrics"],
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
    siteName: "AcadMusic Portfolio",
    title: "AcadMusic - Apple Music Clone Portfolio by Rasyad",
    description: "A modern Apple Music clone web application built with Next.js, Supabase, and Cloudflare Edge Runtime. A developer portfolio project by Rasyad Azizan.",
    locale: "id_ID",
    url: "https://music.rasyadazizan.site",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AcadMusic - Apple Music Clone Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@rasyadazizan",
    creator: "@rasyadazizan",
    title: "AcadMusic - Apple Music Clone Portfolio",
    description: "A modern Apple Music clone web application built with Next.js, Supabase, and Cloudflare Edge Runtime. A developer portfolio project.",
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
        <GooeyToasterProvider />
      </body>
    </html>
  );
}

