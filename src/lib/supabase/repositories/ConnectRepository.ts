import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../client';
import { DeviceInfo, ConnectBroadcastMessage } from '@/types/connect';

export class ConnectRepository {
  private static instance: ConnectRepository;
  private channel: RealtimeChannel | null = null;
  private channelName: string | null = null;

  private constructor() {}

  public static getInstance(): ConnectRepository {
    if (!ConnectRepository.instance) {
      ConnectRepository.instance = new ConnectRepository();
    }
    return ConnectRepository.instance;
  }

  public joinChannel(
    userId: string,
    onPresenceSync: (devices: DeviceInfo[]) => void,
    onBroadcast: (payload: ConnectBroadcastMessage) => void
  ): RealtimeChannel {
    const targetChannel = `connect:${userId}`;

    if (this.channel && this.channelName !== targetChannel) {
      this.leaveChannel();
    }

    if (!this.channel) {
      this.channelName = targetChannel;
      this.channel = supabase.channel(targetChannel);

      this.channel
        .on('presence', { event: 'sync' }, () => {
          if (!this.channel) return;
          const state = this.channel.presenceState<DeviceInfo>();
          const devices: DeviceInfo[] = [];
          Object.values(state).forEach((presences) => {
            presences.forEach((p) => {
              if (p.tabInstanceId) {
                devices.push(p);
              }
            });
          });
          // Deduplicate by tabInstanceId (handles Fast Refresh ghost sessions)
          const uniqueMap = new Map<string, DeviceInfo>();
          devices.forEach((d) => uniqueMap.set(d.tabInstanceId, d));
          onPresenceSync(Array.from(uniqueMap.values()));
        })
        .on('broadcast', { event: 'CONNECT_MSG' }, ({ payload }) => {
          if (payload) {
            onBroadcast(payload as ConnectBroadcastMessage);
          }
        })
        .subscribe();
    }

    return this.channel;
  }

  public async trackPresence(deviceInfo: DeviceInfo): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.track(deviceInfo);
      } catch (err) {
        console.warn('ConnectRepository: Failed to track presence:', err);
      }
    }
  }

  public async sendBroadcast(payload: ConnectBroadcastMessage): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.send({
          type: 'broadcast',
          event: 'CONNECT_MSG',
          payload,
        });
      } catch (err) {
        console.warn('ConnectRepository: Failed to send broadcast:', err);
      }
    }
  }

  public leaveChannel(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.channelName = null;
    }
  }
}
