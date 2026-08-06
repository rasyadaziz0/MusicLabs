import { DeviceInfo } from '@/types/connect';

export interface DeviceRowProps {
  device: DeviceInfo;
  isActive: boolean;
  isMe: boolean;
  onSelect: () => void;
}
