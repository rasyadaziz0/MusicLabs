'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ContextMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export function ContextMenuItem({
  icon,
  label,
  rightElement,
  danger,
  className,
  ...props
}: ContextMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full text-left px-3 py-2 text-[13px] font-medium transition-colors hover:bg-white/10 flex items-center gap-2.5 disabled:opacity-60",
        danger ? "text-primary" : "text-white",
        className
      )}
      {...props}
    >
      {icon && (
        <span className={cn("flex-shrink-0", danger ? "" : "text-white/60")}>
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {rightElement && (
        <span className="flex-shrink-0 text-white/40 group-hover:text-white/80 transition-colors">
          {rightElement}
        </span>
      )}
    </button>
  );
}

export function ContextMenuDivider() {
  return <div className="my-1 border-t border-white/10" />;
}
