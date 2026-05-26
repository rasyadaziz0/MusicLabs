'use client';

import { useEffect } from 'react';
import { X, AudioLines, Mic, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIdentifyController } from '@/hooks/useIdentifyController';
import { IdentifyStates } from './ui/IdentifyStates';
import { IdentifyResults } from './ui/IdentifyResults';

interface IdentifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IdentifyModal({ isOpen, onClose }: IdentifyModalProps) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const isAuthenticated = !!user;

  const {
    mode,
    setMode,
    state,
    matchedSong,
    rawMatch,
    speechResults,
    errorMessage,
    recorder,
    speech,
    quota,
    handleAuddIdentify,
    handleSpeechStart,
    handlePlay,
    handleSearchForSong,
    handleCancel,
    resetState,
  } = useIdentifyController();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
      speech.resetTranscript();
    }
  }, [isOpen, resetState, speech]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 identify-modal-enter">
        <div className="bg-[#1a1a1e]/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-lg font-bold text-white">Identify Song</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Auth gate: require login ───────────────────────── */}
          {!authLoading && !isAuthenticated ? (
            <div className="px-6 pb-8 pt-4 min-h-[320px] flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#FA243C]/10 border border-[#FA243C]/20 flex items-center justify-center mb-5">
                <LogIn size={36} className="text-[#FA243C]" />
              </div>
              <p className="text-white/90 font-semibold text-lg mb-2">
                Login Required
              </p>
              <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-[280px]">
                Sign in to identify songs. This helps us keep the service running smoothly.
              </p>
              <button
                onClick={() => signInWithGoogle('/').then(() => onClose())}
                className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-white text-[#1a1a1e] font-bold text-sm hover:bg-white/90 active:scale-95 transition-all shadow-lg"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </div>
          ) : (
          <>
          {/* Mode Tabs */}
          <div className="flex mx-6 mb-5 bg-white/[0.06] rounded-xl p-1 border border-white/[0.04]">
            <button
              onClick={() => setMode('audd')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'audd'
                  ? 'bg-[#FA243C] text-white shadow-lg shadow-[#FA243C]/20'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <AudioLines size={16} />
              Identify
            </button>
            <button
              onClick={() => setMode('speech')}
              disabled={!speech.isSupported}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                mode === 'speech'
                  ? 'bg-[#FA243C] text-white shadow-lg shadow-[#FA243C]/20'
                  : 'text-white/50 hover:text-white/80'
              } ${!speech.isSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={!speech.isSupported ? 'Not supported in this browser' : ''}
            >
              <Mic size={16} />
              Sing / Say
            </button>
          </div>

          {/* Content Area */}
          <div className="px-6 pb-6 min-h-[320px] flex flex-col items-center justify-center">
            {state !== 'results' ? (
              <IdentifyStates
                state={state}
                mode={mode}
                recorder={recorder}
                speech={speech}
                quota={quota}
                rawMatch={rawMatch}
                errorMessage={errorMessage}
                onAuddIdentify={handleAuddIdentify}
                onSpeechStart={handleSpeechStart}
                onCancel={handleCancel}
                onReset={resetState}
              />
            ) : (
              <IdentifyResults
                mode={mode}
                matchedSong={matchedSong}
                speechResults={speechResults}
                speechTranscript={speech.transcript}
                onPlay={(song) => handlePlay(song, onClose)}
                onSearch={(title, artist) => handleSearchForSong(title, artist, onClose)}
                onReset={resetState}
              />
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
