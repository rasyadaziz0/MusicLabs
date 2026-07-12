/**
 * Slug utilities for SEO-friendly URLs — Apple Music style.
 *
 * URL pattern (3-segment, clean):
 *   /musik/[artistSlug]/[titleSlug]/[trackId]
 *
 * Examples:
 *   /musik/napking-kaira-shashia/aku-kamu/1736547535
 *   /musik/adele/hello/dQw4w9WgXcQ
 *
 * Track ID is its own path segment — never mixed into the title slug.
 * This mirrors Apple Music's URL structure:
 *   music.apple.com/id/album/aku-kamu/1736547534?i=1736547535
 */

/**
 * Convert arbitrary text to a URL-safe slug.
 * Strips diacritics, CJK, emoji; keeps only [a-z0-9-].
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')     // Strip diacritics
    .replace(/[^\w\s-]/g, '')            // Remove non-word chars
    .replace(/[\s_]+/g, '-')             // Spaces/underscores → hyphens
    .replace(/-+/g, '-')                 // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '')             // Trim leading/trailing hyphens
    .toLowerCase()
    || 'untitled';                        // Fallback for pure-CJK/emoji titles
}

/**
 * Extract the clean numeric/video ID from a raw track ID.
 *
 * @example
 * stripTrackIdPrefix('itunes-1736547535') → '1736547535'
 * stripTrackIdPrefix('dQw4w9WgXcQ')       → 'dQw4w9WgXcQ'
 */
export function stripTrackIdPrefix(trackId: string): string {
  return trackId.replace(/^itunes-/, '');
}

/**
 * Reconstruct the full internal track ID from a clean URL ID.
 *
 * If the ID is purely numeric → it's an iTunes track → prepend 'itunes-'.
 * Otherwise (alphanumeric 11-char) → it's a YouTube video ID → use as-is.
 *
 * @example
 * restoreTrackId('1736547535') → 'itunes-1736547535'
 * restoreTrackId('dQw4w9WgXcQ') → 'dQw4w9WgXcQ'
 */
export function restoreTrackId(cleanId: string): string {
  if (/^\d+$/.test(cleanId)) {
    return `itunes-${cleanId}`;
  }
  return cleanId;
}

/**
 * Build the artist slug for a URL segment.
 */
export function buildArtistSlug(artistName: string): string {
  return slugify(artistName);
}

/**
 * Build the full path for a track page.
 *
 * @example
 * buildTrackPath('Napking, Kaira Shashia', 'Aku + Kamu', 'itunes-1736547535')
 * // → "/musik/napking-kaira-shashia/aku-kamu/1736547535"
 *
 * buildTrackPath('Adele', 'Hello', 'dQw4w9WgXcQ')
 * // → "/musik/adele/hello/dQw4w9WgXcQ"
 */
export function buildTrackPath(artistName: string, title: string, trackId: string): string {
  const artistSlug = buildArtistSlug(artistName);
  const titleSlug = slugify(title);
  const cleanId = stripTrackIdPrefix(trackId);
  return `/musik/${artistSlug}/${titleSlug}/${cleanId}`;
}
