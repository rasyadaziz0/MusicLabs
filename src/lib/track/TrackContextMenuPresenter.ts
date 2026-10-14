import { Song } from '@/types/music';
import { SlugHelper } from '@/lib/utils/SlugHelper';
import { escapeHtmlAttr } from '@/lib/utils/escapeHtml';
import { ImageHelper } from '@/lib/utils/ImageHelper';
import { ArtistParser } from '@/lib/utils/ArtistParser';

export class TrackContextMenuPresenter {
  public static getOrigin(): string {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  public static getTrackUrl(track: Song, origin?: string): string {
    const base = origin ?? this.getOrigin();
    const artistName = track.artists?.primary?.[0]?.name || 'unknown';
    return `${base}${SlugHelper.buildTrackPath(artistName, track.name, track.id)}`;
  }

  public static getShareData(track: Song, origin?: string) {
    const url = this.getTrackUrl(track, origin);
    const artistName = track.artists?.primary?.[0]?.name || 'Unknown Artist';
    return {
      title: track.name,
      text: `Check out ${track.name} by ${artistName}`,
      url,
    };
  }

  public static getEmbedCode(track: Song, origin?: string): string {
    const base = origin ?? this.getOrigin();
    const escapedTitle = escapeHtmlAttr(track.name);
    const escapedArtist = track.artists?.primary?.[0]?.name
      ? escapeHtmlAttr(track.artists.primary[0].name)
      : '';
    const embedTitle = `${escapedTitle} — ${escapedArtist} | AcadMusic Embed`;
    const src = `${base}/embed/track/${track.id}`;
    return `<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="175" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="${src}" title="${embedTitle}"></iframe>`;
  }

  public static hasAlbum(track: Song): boolean {
    return Boolean(track.album?.id);
  }

  public static hasArtist(track: Song): boolean {
    return Boolean(track.artists?.primary?.length > 0 && track.artists.primary[0].id);
  }

  public static getAlbumUrl(track: Song): string {
    return `/album/${track.album.id}`;
  }

  public static getArtistUrl(track: Song): string {
    return track.artists.primary[0] ? ArtistParser.getArtistLink(track.artists.primary[0]) : '';
  }

  public static getArtistNames(track: Song): string {
    return (track.artists?.primary || []).map((a) => a.name).join(', ');
  }

  public static getCoverImage(track: Song): string | null {
    return ImageHelper.getBestImageUrl(track.image);
  }

  public static getFlyoutDirection(position: { x: number; y: number } | null): 'left' | 'right' {
    if (!position || typeof window === 'undefined') return 'right';
    return position.x > window.innerWidth / 2 ? 'left' : 'right';
  }
}
