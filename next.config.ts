import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  serverExternalPackages: ['sharp'],
  reactCompiler: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost', '10.110.2.174', 'music.rasyadazizan.site'],

  // ── PAKSA binary sharp + libvips ikut ke serverless function ──
  outputFileTracingIncludes: {
    '/api/upload': [
      'node_modules/@img/sharp-linux-x64/**/*',
      'node_modules/@img/sharp-libvips-linux-x64/**/*',
    ],
  },
  turbopack: {
    root: __dirname,
  },

  // ─── Security Headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https: http:; font-src 'self' data:; connect-src 'self' https: http: wss:; media-src 'self' blob: https: http:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" },
        ],
      },
      {
        source: '/embed/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-src https://www.youtube.com; media-src https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors *;",
          },
          // Override X-Frame-Options for legacy browsers that don't support CSP frame-ancestors
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
        ],
      },
      {
        // HSTS only for production (non-localhost)
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.dzcdn.net',  // Deezer CDN — covers cdn-images, e-cdns-images, etc.
      },
      {
        protocol: 'https',
        hostname: 'api.deezer.com',            // Deezer API image redirects
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '*.mzstatic.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'img.rasyadazizan.site',
      },
      {
        protocol: 'https',
        hostname: '*.rasyadazizan.site',
      },
    ],
  },
};

export default nextConfig;
