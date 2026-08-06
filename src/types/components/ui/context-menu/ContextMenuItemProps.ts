import React from 'react';

export interface ContextMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  rightElement?: React.ReactNode;
  danger?: boolean;
}
