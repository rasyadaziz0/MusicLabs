import { PlaylistCollaborator } from '@/types/models/Collaborator';

export interface ICollaboratorRepository {
  getPlaylistCollaborators(playlistId: string): Promise<PlaylistCollaborator[]>;
  addCollaborator(playlistId: string, userId: string): Promise<boolean>;
  removeCollaborator(playlistId: string, userId: string): Promise<boolean>;
  isCollaborator(playlistId: string, userId: string): Promise<boolean>;
}
