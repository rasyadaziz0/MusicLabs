'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Music } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface GuestGateProps {
  isOpen: boolean;
  onClose: () => void;
  /** The action user attempted, shown in the prompt */
  action?: string;
}

export default function GuestGate({ isOpen, onClose, action = 'use this feature' }: GuestGateProps) {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    await signInWithGoogle('/');
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-[360px] rounded-2xl bg-[#1c1c1e] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors z-10"
              >
                <X size={14} />
              </button>

              {/* Header gradient */}
              <div className="h-24 bg-gradient-to-br from-[#FA243C] to-[#FF6275] flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Music size={28} className="text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <h3 className="text-[18px] font-bold text-white mb-2">
                  Sign in to {action}
                </h3>
                <p className="text-[13px] text-white/50 leading-relaxed mb-6">
                  Create an account or sign in to save your favorites, build playlists, and enjoy full-length songs.
                </p>

                {/* Google sign-in */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors mb-3"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                {/* Email sign-in */}
                <Link
                  href="/login"
                  className="block w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-[13px] font-semibold hover:bg-white/10 transition-colors text-center"
                >
                  Sign in with Email
                </Link>

                <p className="mt-4 text-[11px] text-white/30">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-[#FA243C] hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
