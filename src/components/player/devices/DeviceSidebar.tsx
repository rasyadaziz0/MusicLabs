'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { GlassBar } from '@/components/ui/LiquidGlass';
import { DeviceSidebarHeader } from './DeviceSidebarHeader';
import { DeviceRow } from './DeviceRow';
import { DeviceRenameFooter } from './DeviceRenameFooter';
import { DeviceInfo } from '@/types/connect';

export interface DeviceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeviceSidebar({ isOpen, onClose }: DeviceSidebarProps) {
  const {
    myTabId,
    activeTabId,
    connectedDevices,
    isElecting,
    transferPlayback,
    renameDevice,
  } = (usePlayer() as any);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const myDevice: DeviceInfo | undefined = connectedDevices?.find((d: any) => d.tabInstanceId === myTabId);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={sidebarRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full md:w-[340px]"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
          }}
        >
          <GlassBar
            className="absolute inset-0 w-full h-full border-none"
            style={{ backgroundColor: 'rgba(32, 32, 33, 0.5)', borderRadius: '0px', boxShadow: 'none' }}
          >
            <div className="flex flex-col h-full w-full relative">
              <div className="relative z-30 flex flex-col h-full w-full">
                {/* Header */}
                <DeviceSidebarHeader onClose={onClose} />

                {/* Rename Current Device (At top for easy access) */}
                <DeviceRenameFooter
                  currentLabel={myDevice?.label}
                  onRename={renameDevice}
                />

                {/* Reconnecting Banner */}
                {isElecting && (
                  <div className="flex items-center gap-2.5 mx-4 mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse flex-shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>Menyambungkan ulang ke pemutar aktif…</span>
                  </div>
                )}

                {/* Devices List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 14px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.15) transparent',
                  }}
                >
                  {(!connectedDevices || connectedDevices.length === 0) ? (
                    <div className="flex items-center justify-center h-40 text-sm text-white/40">
                      Tidak ada perangkat lain yang terdeteksi
                    </div>
                  ) : (
                    connectedDevices.map((device: DeviceInfo, idx: number) => {
                      const isActive = device.tabInstanceId === activeTabId;
                      const isMe = device.tabInstanceId === myTabId;

                      return (
                        <DeviceRow
                          key={`${device.tabInstanceId}-${idx}`}
                          device={device}
                          isActive={isActive}
                          isMe={isMe}
                          onSelect={() => !isActive && transferPlayback(device.tabInstanceId)}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </GlassBar>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
