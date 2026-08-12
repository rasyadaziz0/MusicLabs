import { HandoffPayload, RemoteCommandType } from '@/types/connect';
import { Song } from '@/types/music';

export interface UseSpotifyConnectOptions {
  getCurrentTrack: () => Song | null;
  getCurrentTime: () => number;
  getDuration: () => number;
  getIsPlaying: () => boolean;
  getVolume: () => number;
  getQueue: () => Song[];
  getQueueIndex: () => number;
  getIsShuffled: () => boolean;
  getRepeatMode: () => 'none' | 'all' | 'one';
  onReceiveHandoff: (payload: HandoffPayload) => void;
  onReceiveCommand: (command: RemoteCommandType, payload?: { time?: number; volume?: number }) => void;
  onActivePlayerPause: () => void;
}
