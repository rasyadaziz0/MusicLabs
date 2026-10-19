'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { ConnectRepository } from '@/lib/supabase/repositories/ConnectRepository';
import {
  ConnectBroadcastMessage,
  DeviceInfo,
  RemoteCommandType,
  RemotePlaybackState,
  StateSyncPayload,
} from '@/types/connect';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as ConnectEngine from '../lib/services/connect';
import { ConnectPayloadBuilder } from '../lib/services/connect/ConnectPayloadBuilder';
import { ConnectBroadcastRouter } from '../lib/services/connect/ConnectBroadcastRouter';
import { UseSpotifyConnectOptions } from '@/types/hooks/spotify';

/**
 * useSpotifyConnect
 * React hook connecting local audio playback to the Supabase Realtime multi-device ecosystem.
 */
export function useSpotifyConnect(options: UseSpotifyConnectOptions) {
  const { user } = useAuth();
  const repo = ConnectRepository.getInstance();

  const [myTabId] = useState(() => ConnectEngine.getOrCreateTabId());
  const [deviceLabel, setDeviceLabel] = useState(() => ConnectEngine.getOrCreateDeviceLabel());

  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  const connectedDevicesRef = useRef<DeviceInfo[]>([]);
  connectedDevicesRef.current = connectedDevices;

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

  const sendFullSync = useCallback(() => {
    const cbs = callbacksRef.current;
    const track = cbs.getCurrentTrack();
    if (!track) return;

    const payload = ConnectPayloadBuilder.buildFullSync('track_change', {
      track,
      queue: cbs.getQueue(),
      queueIndex: cbs.getQueueIndex(),
      position: cbs.getCurrentTime(),
      isPlaying: cbs.getIsPlaying(),
      volume: cbs.getVolume(),
      duration: cbs.getDuration(),
      isShuffled: cbs.getIsShuffled(),
      repeatMode: cbs.getRepeatMode(),
    });

    sendBroadcast(payload);
  }, [sendBroadcast]);

  const handleBroadcast = useCallback(
    (msg: ConnectBroadcastMessage) => {
      ConnectBroadcastRouter.route(msg, {
        myTabId,
        activeTabId,
        isActivePlayer,
        connectedDevices: connectedDevicesRef.current,
        callbacks: callbacksRef.current,
        onSetActiveTab: (tabId) => {
          setActiveTabId(tabId);
          setIsElecting(false);
        },
        onSetAutoplayBlocked: setAutoplayBlocked,
        onUpdateRemoteState: setRemoteState,
        onSendFullSync: sendFullSync,
      });
    },
    [myTabId, activeTabId, isActivePlayer, sendFullSync]
  );

  useEffect(() => {
    if (!user?.id || !myTabId) return;
    let isCancelled = false;

    const initChannel = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await supabase.realtime.setAuth(session.access_token);
        }
      } catch (err) {
        console.warn('[Connect] Failed to set realtime auth token:', err);
      }

      if (isCancelled) return;

      repo.joinChannel(
        user.id,
        (devices) => {
          setConnectedDevices(devices);
          connectedDevicesRef.current = devices;
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
    };

    initChannel();

    return () => {
      isCancelled = true;
      repo.leaveChannel();
    };
  }, [user?.id, myTabId, deviceLabel, repo, runElection, handleBroadcast]);

  // Interpolate remote track position every 1 second
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

  // Periodic lightweight sync from active player to remotes
  useEffect(() => {
    if (!isActivePlayer) return;
    syncIntervalRef.current = setInterval(() => {
      const track = callbacksRef.current.getCurrentTrack();
      if (!track) return;

      const payload = ConnectPayloadBuilder.buildLightweightSync('seek', {
        trackId: track.id,
        position: callbacksRef.current.getCurrentTime(),
        isPlaying: callbacksRef.current.getIsPlaying(),
        volume: callbacksRef.current.getVolume(),
        duration: callbacksRef.current.getDuration(),
      });
      sendBroadcast(payload);
    }, 4000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isActivePlayer, sendBroadcast]);

  const transferPlayback = useCallback(
    (targetId: string) => {
      const track = callbacksRef.current.getCurrentTrack();
      if (!track) return;

      const handoffMsg = ConnectPayloadBuilder.buildHandoff(targetId, myTabId, {
        track,
        queue: callbacksRef.current.getQueue(),
        queueIndex: callbacksRef.current.getQueueIndex(),
        position: callbacksRef.current.getCurrentTime(),
        isPlaying: callbacksRef.current.getIsPlaying(),
        volume: callbacksRef.current.getVolume(),
        isShuffled: callbacksRef.current.getIsShuffled(),
        repeatMode: callbacksRef.current.getRepeatMode(),
      });

      sendBroadcast(handoffMsg);
      sendBroadcast(ConnectPayloadBuilder.buildClaimActive(targetId));
    },
    [sendBroadcast, myTabId]
  );

  const sendRemoteCommand = useCallback(
    (command: RemoteCommandType, payload?: { time?: number; volume?: number }) => {
      const cmdMsg = ConnectPayloadBuilder.buildRemoteCommand(command, myTabId, payload);
      sendBroadcast(cmdMsg);
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
        const payload = ConnectPayloadBuilder.buildFullSync(event, {
          track,
          queue: callbacksRef.current.getQueue(),
          queueIndex: callbacksRef.current.getQueueIndex(),
          position: callbacksRef.current.getCurrentTime(),
          isPlaying: callbacksRef.current.getIsPlaying(),
          volume: callbacksRef.current.getVolume(),
          duration: callbacksRef.current.getDuration(),
          isShuffled: callbacksRef.current.getIsShuffled(),
          repeatMode: callbacksRef.current.getRepeatMode(),
        });
        sendBroadcast(payload);
      } else {
        const payload = ConnectPayloadBuilder.buildLightweightSync(event, {
          trackId: track.id,
          position: callbacksRef.current.getCurrentTime(),
          isPlaying: callbacksRef.current.getIsPlaying(),
          volume: callbacksRef.current.getVolume(),
          duration: callbacksRef.current.getDuration(),
        });
        sendBroadcast(payload);
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
