'use client';

import { useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPortalRoot } from '@/lib/utils/portalRoot';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

export interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number } | null;
  mobileHeader?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ContextMenu({
  isOpen,
  onClose,
  position,
  mobileHeader,
  children,
  className
}: ContextMenuProps) {
  const isMobile = useIsMobile();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click, scroll, resize, escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleScroll = (e: Event) => {
      if (isMobile) return;
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', onClose);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', onClose);
    };
  }, [isOpen, onClose, isMobile]);

  // Clamp position to viewport for desktop
  useLayoutEffect(() => {
    if (isOpen && position && menuRef.current && !isMobile) {
      const el = menuRef.current;
      el.style.left = `${position.x}px`;
      el.style.top = `${position.y}px`;

      const rect = el.getBoundingClientRect();
      let originalX = position.x;
      let originalY = position.y;
      let x = originalX;
      let y = originalY;

      if (x + rect.width > window.innerWidth) {
        x = originalX - rect.width;
      }
      if (y + rect.height > window.innerHeight) {
        y = originalY - rect.height;
      }

      el.style.left = `${Math.max(10, x)}px`;
      el.style.top = `${Math.max(10, y)}px`;
    }
  }, [isOpen, position, isMobile]);

  // --- Mobile Bottom Sheet ---
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={onClose}
            />
            <motion.div
              ref={menuRef}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[101] bg-[#1c1c1e] rounded-t-3xl pt-2 pb-safe shadow-2xl flex flex-col"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-3" />
              {mobileHeader}
              <div className="overflow-y-auto max-h-[60vh] pb-6">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // --- Desktop Portal Menu ---
  if (!isOpen || !position) return null;
  
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn("fixed z-[100] w-60 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl", className)}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    getPortalRoot()
  );
}
