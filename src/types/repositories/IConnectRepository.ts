import { RealtimeChannel } from '@supabase/supabase-js';
import { DeviceInfo, ConnectBroadcastMessage } from '@/types/connect';

export interface IConnectRepository {
  joinChannel(
    userId: string,
    onPresenceSync: (devices: DeviceInfo[]) => void,
    onBroadcast: (payload: ConnectBroadcastMessage) => void
  ): RealtimeChannel;
  trackPresence(deviceInfo: DeviceInfo): Promise<void>;
  sendBroadcast(payload: ConnectBroadcastMessage): Promise<void>;
  leaveChannel(): void;
}
