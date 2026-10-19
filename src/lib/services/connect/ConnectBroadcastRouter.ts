import {
  ConnectBroadcastMessage,
  DeviceInfo,
  RemotePlaybackState,
} from '@/types/connect';
import { UseSpotifyConnectOptions } from '@/types/hooks/spotify';

export interface RouteBroadcastContext {
  myTabId: string;
  activeTabId: string | null;
  isActivePlayer: boolean;
  connectedDevices: DeviceInfo[];
  callbacks: UseSpotifyConnectOptions;
  onSetActiveTab: (tabId: string) => void;
  onSetAutoplayBlocked: (blocked: boolean) => void;
  onUpdateRemoteState: (updater: (prev: RemotePlaybackState | null) => RemotePlaybackState | null) => void;
  onSendFullSync: () => void;
}

/**
 * ConnectBroadcastRouter
 * Encapsulates the routing and validation of incoming Supabase Realtime broadcast messages.
 */
export class ConnectBroadcastRouter {
  /**
   * Validates if the sender is registered in presence list.
   */
  public static isKnownSender(tabId: string | undefined, connectedDevices: DeviceInfo[]): boolean {
    return Boolean(tabId && connectedDevices.some((d) => d.tabInstanceId === tabId));
  }

  /**
   * Processes an incoming broadcast message according to its type and current player status.
   */
  public static route(msg: ConnectBroadcastMessage, ctx: RouteBroadcastContext): void {
    if (!msg || !msg.type) return;

    const {
      myTabId,
      activeTabId,
      isActivePlayer,
      connectedDevices,
      callbacks,
      onSetActiveTab,
      onSetAutoplayBlocked,
      onUpdateRemoteState,
      onSendFullSync,
    } = ctx;

    // 1. CLAIM_ACTIVE
    if (msg.type === 'CLAIM_ACTIVE') {
      if (
        connectedDevices.length > 0 &&
        !connectedDevices.some((d) => d.tabInstanceId === msg.tabInstanceId)
      ) {
        console.warn('[Connect] Rejected CLAIM_ACTIVE from unknown device:', msg.tabInstanceId);
        return;
      }
      onSetActiveTab(msg.tabInstanceId);
      if (msg.tabInstanceId !== myTabId) {
        callbacks.onActivePlayerPause();
      }
      return;
    }

    // 2. AUTOPLAY_BLOCKED
    if (msg.type === 'AUTOPLAY_BLOCKED') {
      if (msg.tabInstanceId === activeTabId) {
        onSetAutoplayBlocked(true);
      }
      return;
    }

    // 3. REQUEST_FULL_SYNC
    if (msg.type === 'REQUEST_FULL_SYNC') {
      if (isActivePlayer) {
        onSendFullSync();
      }
      return;
    }

    // 4. Messages targeting the Active Player
    if (isActivePlayer) {
      if (msg.type === 'REMOTE_CMD') {
        if (!this.isKnownSender(msg.senderTabId, connectedDevices)) {
          console.warn('[Connect] Rejected REMOTE_CMD from unknown device:', msg.senderTabId);
          return;
        }
        callbacks.onReceiveCommand(msg.command, msg.payload);
      } else if (msg.type === 'HANDOFF' && msg.targetTabInstanceId === myTabId) {
        if (connectedDevices.length > 0 && !this.isKnownSender((msg as any).senderTabId, connectedDevices)) {
          console.warn('[Connect] Rejected HANDOFF from unknown device');
          return;
        }
        callbacks.onReceiveHandoff(msg);
      }
      return;
    }

    // 5. Messages targeting Remote Tabs (Active Player broadcast updates)
    if (!isActivePlayer) {
      if (msg.type === 'FULL_SYNC') {
        onUpdateRemoteState(() => ({
          track: msg.track,
          isPlaying: msg.isPlaying,
          position: msg.position,
          timestamp: Date.now(),
          volume: msg.volume,
          duration: msg.duration,
          queue: msg.queue,
          queueIndex: msg.queueIndex,
          isShuffled: msg.isShuffled,
          repeatMode: msg.repeatMode,
        }));
      } else if (msg.type === 'LIGHTWEIGHT_SYNC') {
        onUpdateRemoteState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            isPlaying: msg.isPlaying,
            position: msg.position,
            timestamp: Date.now(),
            volume: msg.volume,
          };
        });
      }
    }
  }
}
