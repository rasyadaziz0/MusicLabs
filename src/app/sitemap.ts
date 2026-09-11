import { createClient } from '@supabase/supabase-js';
import { SlugHelper } from '@/lib/utils/SlugHelper';
import type { MetadataRoute } from 'next';

/**
 * Dynamic sitemap fetching indexed tracks from the database.
 * Cached on Edge CDN for 24 hours (86400s) to prevent bot crawl overload.
 */
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site';
  const now = new Date();

  // Fetch indexed tracks without touching cookies or headers
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const trackEntries: MetadataRoute.Sitemap = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      const { data: tracks } = await supabase
        .from('indexed_tracks')
        .select('track_id, name, artist_name, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1000); // Max 1000 tracks per sitemap file

      (tracks || []).forEach((t) => {
        const updatedAt = new Date(t.updated_at);

        // Track entry
        trackEntries.push({
          url: `${baseUrl}${SlugHelper.buildTrackPath(t.artist_name, t.name, t.track_id)}`,
          lastModified: updatedAt,
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      });
    } catch {
      // Graceful fallback during build if DB is unreachable
    }
  }

  return [
    // ── Core pages ──
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/radio`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/recap`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },

    // ── Legal pages ──
    {
      url: `${baseUrl}/dmca`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...trackEntries,
  ];
}
