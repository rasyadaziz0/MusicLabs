import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
          '/api/',
          '/embed/',
        ],
        crawlDelay: 5,
      },
      {
        userAgent: [
          'Bytespider',
          'PetalBot',
          'SemrushBot',
          'AhrefsBot',
          'DotBot',
          'MJ12bot',
          'DataForSeoBot',
          'GPTBot',
          'CCBot',
          'ClaudeBot',
          'Anthropic-ai',
          'Amazonbot',
          'FacebookBot',
        ],
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
