import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { buildTrackPath } from '@/lib/utils/slugify';

/**
 * Dynamic sitemap fetching indexed tracks from the database.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://music.rasyadazizan.site';
  const now = new Date();

  // Fetch indexed tracks
  const supabase = await createClient();
  const { data: tracks } = await supabase
    .from('indexed_tracks')
    .select('track_id, name, artist_name, updated_at, raw_data')
    .order('updated_at', { ascending: false })
    .limit(1000); // Max 1000 tracks per sitemap file for now

  const trackEntries: MetadataRoute.Sitemap = [];
  const artistMap = new Map<string, Date>();
  const albumMap = new Map<string, Date>();

  (tracks || []).forEach((t) => {
    const updatedAt = new Date(t.updated_at);

    // Track entry
    trackEntries.push({
      url: `${baseUrl}${buildTrackPath(t.artist_name, t.name, t.track_id)}`,
      lastModified: updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Extract unique artist IDs
    const rawData = t.raw_data;
    if (rawData) {
      if (rawData.artists?.primary && Array.isArray(rawData.artists.primary)) {
        rawData.artists.primary.forEach((artist: any) => {
          if (artist.id) {
            // Keep the latest updated_at for each artist
            if (!artistMap.has(artist.id) || artistMap.get(artist.id)! < updatedAt) {
              artistMap.set(artist.id, updatedAt);
            }
          }
        });
      }

      // Extract unique album IDs
      if (rawData.album?.id) {
        if (!albumMap.has(rawData.album.id) || albumMap.get(rawData.album.id)! < updatedAt) {
          albumMap.set(rawData.album.id, updatedAt);
        }
      }
    }
  });

  const artistEntries: MetadataRoute.Sitemap = Array.from(artistMap.entries()).map(([id, lastModified]) => ({
    url: `${baseUrl}/artist/${id}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const albumEntries: MetadataRoute.Sitemap = Array.from(albumMap.entries()).map(([id, lastModified]) => ({
    url: `${baseUrl}/album/${id}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

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
    ...artistEntries,
    ...albumEntries,
  ];
}
