'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteAccountModal({ isOpen, onClose, onConfirm }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-[#1c1c1e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>
                  <h3 className="text-[18px] font-bold text-white">Delete Account</h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-white/60" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                <p className="text-[14px] text-white/60 leading-relaxed mb-4">
                  This action is <span className="text-red-400 font-semibold">permanent and cannot be undone</span>. 
                  All your data will be permanently deleted, including:
                </p>
                <ul className="text-[13px] text-white/50 space-y-1.5 mb-6 pl-4">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400/60" />
                    Your playlists and saved tracks
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400/60" />
                    Listening history and stats
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400/60" />
                    Followers and following data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400/60" />
                    Profile and account information
                  </li>
                </ul>

                <p className="text-[13px] text-white/50 mb-3">
                  Type <span className="font-mono text-white/80 bg-white/5 px-1.5 py-0.5 rounded">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-[14px] font-mono tracking-wider focus:outline-none focus:border-red-500/40 transition-colors placeholder:text-white/20"
                  autoComplete="off"
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 pb-6 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[14px] font-semibold text-white hover:bg-white/[0.1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || isDeleting}
                  className={`
                    flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2
                    ${canDelete && !isDeleting
                      ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                      : 'bg-red-500/20 text-red-500/40 cursor-not-allowed'
                    }
                  `}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
