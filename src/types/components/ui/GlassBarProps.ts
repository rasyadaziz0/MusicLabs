import React from 'react';

export interface GlassBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  refraction?: boolean;
}
