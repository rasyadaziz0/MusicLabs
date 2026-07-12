'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPortalRoot } from '@/lib/utils/portalRoot';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Smartphone, Tablet, X, Edit3, Check, Loader2, MonitorSpeaker, Volume2 } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';
import { GlassBar } from '@/components/ui/LiquidGlass';

export interface DevicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DevicePickerModal({ isOpen, onClose }: DevicePickerModalProps) {
  const {
    myTabId,
    activeTabId,
    connectedDevices,
    isElecting,
    transferPlayback,
    renameDevice,
  } = (usePlayer() as any);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const myDevice = connectedDevices?.find((d: any) => d.tabInstanceId === myTabId);

  const handleStartRename = () => {
    setEditName(myDevice?.label || 'My Device');
    setIsEditing(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      renameDevice(editName.trim());
    }
    setIsEditing(false);
  };

  const getIcon = (type: string, isActive: boolean) => {
    const className = cn("w-5 h-5", isActive ? "text-[#1db954]" : "text-white/70");
    if (type === 'mobile') return <Smartphone className={className} />;
    if (type === 'tablet') return <Tablet className={className} />;
    return <Laptop className={className} />;
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
          <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassBar className="p-6 rounded-[28px] border border-white/15 shadow-2xl bg-[#121216]/80">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <MonitorSpeaker className="w-5 h-5 text-[#1db954]" />
                <h3 className="text-lg font-bold tracking-tight text-white font-display">
                  Hubungkan ke Perangkat
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rename Current Device (Moved to top for easy access) */}
            <div className="py-3 mb-3 border-b border-white/10 bg-white/[0.02] -mx-6 px-6">
              {isEditing ? (
                <form onSubmit={handleSaveRename} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nama perangkat..."
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#1db954]"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-xl bg-[#1db954] text-black hover:bg-[#1db954]/90 transition-colors font-bold flex items-center justify-center"
                    title="Simpan"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="p-1.5 rounded-xl bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Batal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={handleStartRename}
                  className="flex items-center justify-center gap-2 w-full py-1.5 text-xs font-semibold text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#1db954]" />
                  <span className="truncate">Ganti nama perangkat ini ({myDevice?.label || 'Perangkat Ini'})</span>
                </button>
              )}
            </div>

            {/* Reconnecting Banner */}
            {isElecting && (
              <div className="flex items-center gap-2.5 p-3 mb-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>Menyambungkan ulang ke pemutar aktif…</span>
              </div>
            )}

            {/* Devices List */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {connectedDevices?.length === 0 ? (
                <div className="py-8 text-center text-sm text-white/40">
                  Tidak ada perangkat lain yang terdeteksi
                </div>
              ) : (
                connectedDevices?.map((device: any, idx: number) => {
                  const isActive = device.tabInstanceId === activeTabId;
                  const isMe = device.tabInstanceId === myTabId;

                  return (
                    <div
                      key={`${device.tabInstanceId}-${idx}`}
                      onClick={() => !isActive && transferPlayback(device.tabInstanceId)}
                      className={cn(
                        "group relative flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer border",
                        isActive
                          ? "bg-[#1db954]/15 border-[#1db954]/40 shadow-[0_0_20px_rgba(29,185,84,0.15)]"
                          : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/15"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-xl",
                          isActive ? "bg-[#1db954]/20" : "bg-white/5 group-hover:bg-white/10"
                        )}>
                          {getIcon(device.deviceType, isActive)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-bold truncate", isActive ? "text-[#1db954]" : "text-white")}>
                              {device.label}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-white/70">
                                Ini
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/50 truncate">
                            {isActive ? 'Memutar audio di sini' : 'Klik untuk memindahkan'}
                          </span>
                        </div>
                      </div>

                      {/* Active Indicator / Equalizer */}
                      {isActive && (
                        <div className="flex items-end gap-1 px-2 h-4">
                          <span className="w-1 bg-[#1db954] rounded-full animate-[bounce_0.8s_infinite_100ms] h-full" />
                          <span className="w-1 bg-[#1db954] rounded-full animate-[bounce_0.8s_infinite_300ms] h-2/3" />
                          <span className="w-1 bg-[#1db954] rounded-full animate-[bounce_0.8s_infinite_200ms] h-4/5" />
                        </div>
                      )}

                      {!isActive && (
                        <Volume2 className="w-4 h-4 text-white/30 group-hover:text-white transition-colors flex-shrink-0 mr-1" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </GlassBar>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, getPortalRoot());
}
