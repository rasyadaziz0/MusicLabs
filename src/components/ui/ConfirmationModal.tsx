'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}


export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 shadow-2xl z-[101] overflow-hidden"
          >
            {/* Background glow for destructive actions */}
            {isDestructive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-red-500/10 blur-[50px] -z-10 rounded-full" />
            )}
            
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-white/10 text-white'}`}>
                <AlertCircle size={24} />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-white/60 text-[14px] mb-8 leading-relaxed">
                {description}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-white/80 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors ${
                    isDestructive 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
