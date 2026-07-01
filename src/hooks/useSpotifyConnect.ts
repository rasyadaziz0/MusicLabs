'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ConnectRepository } from '@/lib/supabase/repositories/ConnectRepository';
import { ConnectEngine } from '@/lib/services/ConnectEngine';
import {
  DeviceInfo,
  ConnectBroadcastMessage,
  RemoteCommandType,
  RemotePlaybackState,
  HandoffPayload,
  StateSyncPayload,
} from '@/types/connect';
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

export function useSpotifyConnect(options: UseSpotifyConnectOptions) {
  const { user } = useAuth();
  const repo = ConnectRepository.getInstance();

  const [myTabId] = useState(() => ConnectEngine.getOrCreateTabId());
  const [deviceLabel, setDeviceLabel] = useState(() => ConnectEngine.getOrCreateDeviceLabel());

  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isElecting, setIsElecting] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [remoteState, setRemoteState] = useState<RemotePlaybackState | null>(null);

  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const electionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isActivePlayer = Boolean(myTabId && activeTabId && myTabId === activeTabId);

  const sendBroadcast = useCallback(
    (payload: ConnectBroadcastMessage) => repo.sendBroadcast(payload),
    [repo]
  );

  const runElection = useCallback(
    (devices: DeviceInfo[]) => {
      const winner = ConnectEngine.electActivePlayer(devices);
      setActiveTabId(winner);
      setIsElecting(false);

      if (winner && winner !== myTabId) {
        callbacksRef.current.onActivePlayerPause();
      }
    },
    [myTabId]
  );

  const handleBroadcast = useCallback(
    (msg: ConnectBroadcastMessage) => {
      const cbs = callbacksRef.current;
      if (!msg || !msg.type) return;

      if (msg.type === 'CLAIM_ACTIVE') {
        setActiveTabId(msg.tabInstanceId);
        setIsElecting(false);
        if (msg.tabInstanceId !== myTabId) {
          cbs.onActivePlayerPause();
        }
        return;
      }

      if (msg.type === 'AUTOPLAY_BLOCKED') {
        if (msg.tabInstanceId === activeTabId) {
          setAutoplayBlocked(true);
        }
        return;
      }

      if (msg.type === 'REQUEST_FULL_SYNC') {
        if (isActivePlayer) {
          const track = cbs.getCurrentTrack();
          if (track) {
            sendBroadcast({
              type: 'FULL_SYNC',
              event: 'track_change',
              track,
              queue: cbs.getQueue(),
              queueIndex: cbs.getQueueIndex(),
              position: cbs.getCurrentTime(),
              timestamp: Date.now(),
              isPlaying: cbs.getIsPlaying(),
              volume: cbs.getVolume(),
              duration: cbs.getDuration(),
              isShuffled: cbs.getIsShuffled(),
              repeatMode: cbs.getRepeatMode(),
            });
          }
        }
        return;
      }

      if (isActivePlayer) {
        if (msg.type === 'REMOTE_CMD') {
          cbs.onReceiveCommand(msg.command, msg.payload);
        } else if (msg.type === 'HANDOFF' && msg.targetTabInstanceId === myTabId) {
          cbs.onReceiveHandoff(msg);
        }
        return;
      }

      if (!isActivePlayer) {
        if (msg.type === 'FULL_SYNC') {
          setRemoteState({
            track: msg.track,
            isPlaying: msg.isPlaying,
            position: msg.position,
            timestamp: msg.timestamp,
            volume: msg.volume,
            duration: msg.duration,
            queue: msg.queue,
            queueIndex: msg.queueIndex,
            isShuffled: msg.isShuffled,
            repeatMode: msg.repeatMode,
          });
        } else if (msg.type === 'LIGHTWEIGHT_SYNC') {
          setRemoteState((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              isPlaying: msg.isPlaying,
              position: msg.position,
              timestamp: msg.timestamp,
              volume: msg.volume,
            };
          });
        }
      }
    },
    [myTabId, activeTabId, isActivePlayer, sendBroadcast]
  );

  useEffect(() => {
    if (!user?.id || !myTabId) return;

    repo.joinChannel(
      user.id,
      (devices) => {
        setConnectedDevices(devices);
        setIsElecting(true);
        if (electionTimerRef.current) clearTimeout(electionTimerRef.current);
        electionTimerRef.current = setTimeout(() => runElection(devices), 1500);
      },
      handleBroadcast
    );

    repo.trackPresence({
      tabInstanceId: myTabId,
      label: deviceLabel,
      deviceType: ConnectEngine.detectDeviceType(),
      isActivePlayer: false,
      joinedAt: Date.now(),
    });

    return () => repo.leaveChannel();
  }, [user?.id, myTabId, deviceLabel, repo, runElection, handleBroadcast]);

  useEffect(() => {
    if (isActivePlayer || !remoteState?.isPlaying) return;
    const interval = setInterval(() => {
      setRemoteState((prev) => {
        if (!prev || !prev.isPlaying) return prev;
        return {
          ...prev,
          position: ConnectEngine.extrapolatePosition(
            prev.position,
            prev.timestamp,
            prev.isPlaying,
            prev.duration
          ),
          timestamp: Date.now(),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActivePlayer, remoteState?.isPlaying]);

  useEffect(() => {
    if (!isActivePlayer) return;
    syncIntervalRef.current = setInterval(() => {
      const track = callbacksRef.current.getCurrentTrack();
      if (!track) return;
      sendBroadcast({
        type: 'LIGHTWEIGHT_SYNC',
        event: 'seek',
        trackId: track.id,
        position: callbacksRef.current.getCurrentTime(),
        timestamp: Date.now(),
        isPlaying: callbacksRef.current.getIsPlaying(),
        volume: callbacksRef.current.getVolume(),
        duration: callbacksRef.current.getDuration(),
      });
    }, 4000);
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isActivePlayer, sendBroadcast]);

  const transferPlayback = useCallback(
    (targetId: string) => {
      const track = callbacksRef.current.getCurrentTrack();
      if (!track) return;
      sendBroadcast({
        type: 'HANDOFF',
        targetTabInstanceId: targetId,
        track,
        queue: callbacksRef.current.getQueue(),
        queueIndex: callbacksRef.current.getQueueIndex(),
        position: callbacksRef.current.getCurrentTime(),
        isPlaying: callbacksRef.current.getIsPlaying(),
        volume: callbacksRef.current.getVolume(),
        isShuffled: callbacksRef.current.getIsShuffled(),
        repeatMode: callbacksRef.current.getRepeatMode(),
      });
      sendBroadcast({ type: 'CLAIM_ACTIVE', tabInstanceId: targetId });
    },
    [sendBroadcast]
  );

  const sendRemoteCommand = useCallback(
    (command: RemoteCommandType, payload?: { time?: number; volume?: number }) => {
      sendBroadcast({
        type: 'REMOTE_CMD',
        command,
        payload: payload ? { time: payload.time, volume: payload.volume } : undefined,
        optimisticId: ConnectEngine.generateUUID(),
        senderTabId: myTabId,
      });
    },
    [myTabId, sendBroadcast]
  );

  const renameDevice = useCallback(
    (newName: string) => {
      if (!newName || typeof window === 'undefined') return;
      localStorage.setItem('connect_device_label', newName);
      setDeviceLabel(newName);
      repo.trackPresence({
        tabInstanceId: myTabId,
        label: newName,
        deviceType: ConnectEngine.detectDeviceType(),
        isActivePlayer,
        joinedAt: Date.now(),
      });
    },
    [myTabId, isActivePlayer, repo]
  );

  const dismissAutoplayBlock = useCallback(() => {
    setAutoplayBlocked(false);
  }, []);

  const broadcastSync = useCallback(
    (event: StateSyncPayload['event']) => {
      if (!isActivePlayer) return;
      const track = callbacksRef.current.getCurrentTrack();
      if (!track) return;

      if (event === 'track_change' || event === 'queue_change') {
        sendBroadcast({
          type: 'FULL_SYNC',
          event,
          track,
          queue: callbacksRef.current.getQueue(),
          queueIndex: callbacksRef.current.getQueueIndex(),
          position: callbacksRef.current.getCurrentTime(),
          timestamp: Date.now(),
          isPlaying: callbacksRef.current.getIsPlaying(),
          volume: callbacksRef.current.getVolume(),
          duration: callbacksRef.current.getDuration(),
          isShuffled: callbacksRef.current.getIsShuffled(),
          repeatMode: callbacksRef.current.getRepeatMode(),
        });
      } else {
        sendBroadcast({
          type: 'LIGHTWEIGHT_SYNC',
          event,
          trackId: track.id,
          position: callbacksRef.current.getCurrentTime(),
          timestamp: Date.now(),
          isPlaying: callbacksRef.current.getIsPlaying(),
          volume: callbacksRef.current.getVolume(),
          duration: callbacksRef.current.getDuration(),
        });
      }
    },
    [isActivePlayer, sendBroadcast]
  );

  return {
    myTabId,
    activeTabId,
    isActivePlayer,
    connectedDevices,
    autoplayBlocked,
    isElecting,
    remoteState,
    transferPlayback,
    sendRemoteCommand,
    renameDevice,
    dismissAutoplayBlock,
    broadcastSync,
  };
}
