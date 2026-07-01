'use client';

import React, { useState } from 'react';
import { Edit3, Check, X } from 'lucide-react';

export interface DeviceRenameFooterProps {
  currentLabel?: string;
  onRename: (newName: string) => void;
}

export function DeviceRenameFooter({ currentLabel, onRename }: DeviceRenameFooterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const handleStartRename = () => {
    setEditName(currentLabel || 'My Device');
    setIsEditing(true);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div style={{
      padding: '12px 18px',
      borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
      background: 'rgba(255,255,255,0.02)'
    }}>
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
            className="p-1.5 rounded-xl bg-[#1db954] text-black hover:bg-[#1db954]/90 transition-colors font-bold flex items-center justify-center flex-shrink-0"
            title="Simpan"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1.5 rounded-xl bg-white/10 text-white/70 hover:text-white transition-colors flex-shrink-0"
            title="Batal"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <button
          onClick={handleStartRename}
          className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-white/60 hover:text-white rounded-xl hover:bg-white/5 transition-colors border border-white/5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="truncate">Ganti nama perangkat ini ({currentLabel || 'Perangkat Ini'})</span>
        </button>
      )}
    </div>
  );
}
