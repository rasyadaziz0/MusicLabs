import { ConnectBroadcastMessage, DeviceInfo } from '@/types/connect';
import { RealtimeChannel } from '@supabase/supabase-js';

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
