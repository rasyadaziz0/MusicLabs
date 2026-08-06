import React from 'react';

export interface DynamicGradientBackgroundProps {
  coverUrl: string | null | undefined;
  trackId: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
}
