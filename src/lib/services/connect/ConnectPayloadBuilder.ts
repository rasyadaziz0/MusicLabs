import {
  ClaimActivePayload,
  FullSyncPayload,
  HandoffPayload,
  LightweightSyncPayload,
  RemoteCommand,
  RemoteCommandType,
  RequestFullSyncPayload,
} from '@/types/connect';
import { Song } from '@/types/music';
import { generateUUID } from '../connect';

export interface FullSyncSourceState {
  track: Song;
  queue: Song[];
  queueIndex: number;
  position: number;
  isPlaying: boolean;
  volume: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
}

export interface LightweightSyncSourceState {
  trackId: string;
  position: number;
  isPlaying: boolean;
  volume: number;
  duration: number;
}

export interface HandoffSourceState {
  track: Song;
  queue: Song[];
  queueIndex: number;
  position: number;
  isPlaying: boolean;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
}

/**
 * ConnectPayloadBuilder
 * Factory class for creating strongly-typed Supabase Realtime broadcast payloads.
 */
export class ConnectPayloadBuilder {
  public static buildFullSync(
    event: 'track_change' | 'queue_change',
    state: FullSyncSourceState
  ): FullSyncPayload {
    return {
      type: 'FULL_SYNC',
      event,
      track: state.track,
      queue: state.queue,
      queueIndex: state.queueIndex,
      position: state.position,
      timestamp: Date.now(),
      isPlaying: state.isPlaying,
      volume: state.volume,
      duration: state.duration,
      isShuffled: state.isShuffled,
      repeatMode: state.repeatMode,
    };
  }

  public static buildLightweightSync(
    event: 'play' | 'pause' | 'seek' | 'volume_change',
    state: LightweightSyncSourceState
  ): LightweightSyncPayload {
    return {
      type: 'LIGHTWEIGHT_SYNC',
      event,
      trackId: state.trackId,
      position: state.position,
      timestamp: Date.now(),
      isPlaying: state.isPlaying,
      volume: state.volume,
      duration: state.duration,
    };
  }

  public static buildHandoff(
    targetTabInstanceId: string,
    senderTabId: string,
    state: HandoffSourceState
  ): HandoffPayload {
    return {
      type: 'HANDOFF',
      targetTabInstanceId,
      senderTabId,
      track: state.track,
      queue: state.queue,
      queueIndex: state.queueIndex,
      position: state.position,
      isPlaying: state.isPlaying,
      volume: state.volume,
      isShuffled: state.isShuffled,
      repeatMode: state.repeatMode,
    };
  }

  public static buildClaimActive(tabInstanceId: string): ClaimActivePayload {
    return {
      type: 'CLAIM_ACTIVE',
      tabInstanceId,
    };
  }

  public static buildRequestFullSync(requesterTabId: string): RequestFullSyncPayload {
    return {
      type: 'REQUEST_FULL_SYNC',
      requesterTabId,
    };
  }

  public static buildRemoteCommand(
    command: RemoteCommandType,
    senderTabId: string,
    payload?: { time?: number; volume?: number }
  ): RemoteCommand {
    return {
      type: 'REMOTE_CMD',
      command,
      payload: payload ? { time: payload.time, volume: payload.volume } : undefined,
      optimisticId: generateUUID(),
      senderTabId,
    };
  }
}
