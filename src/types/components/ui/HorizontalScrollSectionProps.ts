import React from 'react';

export interface HorizontalScrollSectionProps {
  title: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
}
