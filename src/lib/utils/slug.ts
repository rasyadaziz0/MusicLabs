
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    || 'untitled';
}


export function stripTrackIdPrefix(trackId: string): string {
  return trackId.replace(/^itunes-/, '');
}

export function restoreTrackId(cleanId: string): string {
  if (!cleanId || !/^[A-Za-z0-9_-]{1,64}$/.test(cleanId)) {
    return '';
  }
  if (/^\d+$/.test(cleanId)) {
    return `itunes-${cleanId}`;
  }
  return cleanId;
}

export function buildArtistSlug(artistName: string): string {
  return slugify(artistName);
}

export function buildTrackPath(artistName: string, title: string, trackId: string): string {
  const artistSlug = buildArtistSlug(artistName);
  const titleSlug = slugify(title);
  const cleanId = stripTrackIdPrefix(trackId);
  return `/musik/${artistSlug}/${titleSlug}/${cleanId}`;
}

