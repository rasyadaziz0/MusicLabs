import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/profile/',
          '/library/',
          '/settings/',
          '/login/',
          '/register/',
          '/forgot-password/',
          '/update-password/',
          '/auth/',
          '/import/',
          '/identify/',
          '/playlist/create',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
