import { Song } from './music';

// ─── Device Identity ───

export interface DeviceInfo {
  /** Per-tab UUID from sessionStorage — the REAL registry identity */
  tabInstanceId: string;
  /** Human-readable label, e.g. "Laptop · Chrome" — cosmetic, from localStorage */
  label: string;
  /** Device type inferred from user agent */
  deviceType: 'desktop' | 'mobile' | 'tablet';
  /** Whether this tab is currently the active audio player */
  isActivePlayer: boolean;
  /** Timestamp when this tab joined the Presence channel */
  joinedAt: number;
}

// ─── Broadcast Event Types ───

export type ConnectEventType =
  | 'LIGHTWEIGHT_SYNC'
  | 'FULL_SYNC'
  | 'REMOTE_CMD'
  | 'HANDOFF'
  | 'REQUEST_FULL_SYNC'
  | 'CLAIM_ACTIVE'
  | 'AUTOPLAY_BLOCKED';

// ─── STATE_SYNC Payloads (two tiers) ───

/** Lightweight sync — sent on play/pause/seek/volume_change. No queue, no Song object. */
export interface LightweightSyncPayload {
  type: 'LIGHTWEIGHT_SYNC';
  event: 'play' | 'pause' | 'seek' | 'volume_change';
  trackId: string;
  position: number;
  timestamp: number;  // Date.now() when broadcast
  isPlaying: boolean;
  volume: number;
  duration: number;
}

/** Full sync — sent on track_change/queue_change. Contains full Song + queue. */
export interface FullSyncPayload {
  type: 'FULL_SYNC';
  event: 'track_change' | 'queue_change';
  track: Song;
  queue: Song[];
  queueIndex: number;
  position: number;
  timestamp: number;
  isPlaying: boolean;
  volume: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
}

export type StateSyncPayload = LightweightSyncPayload | FullSyncPayload;

// ─── Remote Commands (Remote → Active Player) ───

export type RemoteCommandType = 'TOGGLE_PLAY' | 'SEEK' | 'NEXT' | 'PREV' | 'SET_VOLUME';

export interface RemoteCommand {
  type: 'REMOTE_CMD';
  command: RemoteCommandType;
  payload?: { time?: number; volume?: number };
  /** Unique ID for optimistic UI tracking */
  optimisticId: string;
  /** tabInstanceId of the sender */
  senderTabId: string;
}

// ─── Handoff (Transfer Playback) ───

export interface HandoffPayload {
  type: 'HANDOFF';
  targetTabInstanceId: string;
  track: Song;
  queue: Song[];
  queueIndex: number;
  /** Position in seconds — read directly from controllerRef, NOT React state */
  position: number;
  isPlaying: boolean;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
}

// ─── Claim Active (Election result) ───

export interface ClaimActivePayload {
  type: 'CLAIM_ACTIVE';
  tabInstanceId: string;
}

// ─── Request Full Sync ───

export interface RequestFullSyncPayload {
  type: 'REQUEST_FULL_SYNC';
  requesterTabId: string;
}

// ─── Autoplay Blocked notification ───

export interface AutoplayBlockedPayload {
  type: 'AUTOPLAY_BLOCKED';
  tabInstanceId: string;
}

// ─── Union of all broadcast messages ───

export type ConnectBroadcastMessage =
  | LightweightSyncPayload
  | FullSyncPayload
  | RemoteCommand
  | HandoffPayload
  | ClaimActivePayload
  | RequestFullSyncPayload
  | AutoplayBlockedPayload;

// ─── Remote Playback State (what Remote tabs store locally) ───

export interface RemotePlaybackState {
  track: Song | null;
  position: number;
  timestamp: number;
  isPlaying: boolean;
  volume: number;
  queue: Song[];
  queueIndex: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'all' | 'one';
}

// ─── Connect State & Actions (exposed by the hook) ───

export interface ConnectState {
  /** This tab's unique instance ID (from sessionStorage) */
  myTabId: string;
  /** The tabInstanceId of the current active player (null if none) */
  activeTabId: string | null;
  /** Convenience flag: myTabId === activeTabId */
  isActivePlayer: boolean;
  /** All tabs/devices currently online */
  connectedDevices: DeviceInfo[];
  /** True if this tab tried to play audio but browser blocked it */
  autoplayBlocked: boolean;
  /** True during the 2-second election debounce window */
  isElecting: boolean;
  /** Remote playback state synced from the active player */
  remoteState: RemotePlaybackState | null;
}

export interface ConnectActions {
  /** Transfer playback to a specific tab/device */
  transferPlayback: (targetTabInstanceId: string) => void;
  /** Send a remote command to the active player */
  sendRemoteCommand: (command: RemoteCommandType, payload?: { time?: number; volume?: number }) => void;
  /** Rename this device's label (saved to localStorage) */
  renameDevice: (newName: string) => void;
  /** Called after user taps "Tap to Start" to unlock autoplay */
  dismissAutoplayBlock: () => void;
  /** Broadcast a state sync event (called by active player) */
  broadcastSync: (event: StateSyncPayload['event']) => void;
}
