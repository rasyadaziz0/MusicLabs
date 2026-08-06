import { ReactNode } from 'react';

export interface AppleMusicHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  cover: ReactNode;
  onPlay?: () => void;
  onShuffle?: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  extraActions?: ReactNode;
  topRightActions?: ReactNode;
  backHref?: string;
}
