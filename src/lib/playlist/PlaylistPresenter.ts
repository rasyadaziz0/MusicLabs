import { PlaylistCollaborator } from '@/types/models/Collaborator';
import { PlaylistRecord } from '@/types/models/Playlist';
import { Song } from '@/types/music';
import { UserProfile } from '@/types/profile';
import { escapeHtmlAttr } from '@/lib/utils/escapeHtml';
import { ImageHelper } from '@/lib/utils/ImageHelper';
import { User } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';

export class PlaylistPresenter {
  constructor(
    public readonly playlist: PlaylistRecord | null | undefined,
    public readonly tracks: Song[],
    public readonly ownerProfile: UserProfile | null | undefined,
    public readonly collaborators: PlaylistCollaborator[],
    public readonly currentUser: User | null
  ) { }

  get id(): string | undefined {
    return this.playlist?.id;
  }

  get name(): string {
    return this.playlist?.name || 'Unknown Playlist';
  }

  get isOwner(): boolean {
    if (!this.playlist || !this.currentUser) return false;
    return this.playlist.user_id === this.currentUser.id;
  }

  get isCollaborator(): boolean {
    if (!this.currentUser) return false;
    return this.collaborators.some((c) => c.user_id === this.currentUser?.id);
  }

  get canEdit(): boolean {
    if (!this.playlist) return false;
    return this.isOwner || this.isCollaborator;
  }

  get isPinned(): boolean {
    return Boolean(this.playlist?.is_pinned);
  }

  get isPublic(): boolean {
    return Boolean(this.playlist?.is_public);
  }

  get coverUrl(): string {
    return (
      this.playlist?.cover_url ||
      ImageHelper.getBestImageUrl(this.tracks[0]?.image ?? []) ||
      ''
    );
  }

  get ownerDisplayName(): string {
    if (!this.playlist?.user_id) return 'Unknown';
    if (this.isOwner) {
      return this.currentUser?.user_metadata?.name || 'You';
    }
    return (
      this.ownerProfile?.display_name ||
      this.ownerProfile?.username ||
      'Unknown User'
    );
  }

  get subtitle(): string {
    if (!this.playlist?.user_id) return 'Unknown';
    const collaboratorSuffix =
      this.collaborators.length > 0
        ? ` & ${this.collaborators.length} collaborators`
        : '';
    return `${this.ownerDisplayName}${collaboratorSuffix}`;
  }

  get description(): string {
    if (!this.playlist) return '';
    const publicPrefix = this.isPublic ? '🌍 Public • ' : '';
    const rawDate =
      this.playlist.updated_at || this.playlist.created_at || new Date();
    const updatedDistance = formatDistanceToNow(new Date(rawDate), {
      addSuffix: true,
    });
    return `${publicPrefix}Updated ${updatedDistance}`;
  }

  get hasTracks(): boolean {
    return this.tracks.length > 0;
  }

  get firstTrack(): Song | null {
    return this.tracks[0] || null;
  }

  getEmbedSnippet(origin = ''): string {
    if (!this.playlist) return '';
    const safePlaylistId = encodeURIComponent(this.playlist.id || '').replace(/['"]/g, '');
    const escapedTitle = escapeHtmlAttr(this.playlist.name);
    const src = escapeHtmlAttr(`${origin}/embed/playlist/${safePlaylistId}`);
    return `<iframe allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" frameborder="0" height="450" style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="${src}" title="${escapedTitle}"></iframe>`;
  }
}
