import { AudioLines, Mic, Loader2, AlertCircle, Music2 } from 'lucide-react';
import { IdentifyMode, IdentifyState } from '@/hooks/useIdentifyController';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useIdentifyQuota } from '@/hooks/useIdentifyQuota';

interface IdentifyStatesProps {
  state: IdentifyState;
  mode: IdentifyMode;
  recorder: ReturnType<typeof useAudioRecorder>;
  speech: ReturnType<typeof useSpeechRecognition>;
  quota: ReturnType<typeof useIdentifyQuota>;
  rawMatch: { title: string; artist: string; album?: string } | null;
  errorMessage: string;
  onAuddIdentify: () => void;
  onSpeechStart: () => void;
  onCancel: () => void;
  onReset: () => void;
}

export function IdentifyStates({
  state,
  mode,
  recorder,
  speech,
  quota,
  rawMatch,
  errorMessage,
  onAuddIdentify,
  onSpeechStart,
  onCancel,
  onReset,
}: IdentifyStatesProps) {
  
  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center gap-5 text-center animate-in fade-in duration-300">
        {mode === 'audd' ? (
          <>
            <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-[#FA243C]/10 border border-[#FA243C]/20 flex items-center justify-center">
              <AudioLines size={40} className="text-[#FA243C]" />
            </div>
            <div>
              <p className="text-white/90 font-medium text-lg sm:text-base mb-1">
                Play a song nearby
              </p>
              <p className="text-white/40 text-sm">
                We'll listen for 8 seconds and identify it
              </p>
            </div>
            <button
              onClick={onAuddIdentify}
              disabled={quota.isExhausted}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${
                quota.isExhausted
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-[#FA243C] text-white hover:bg-[#FA243C]/90 hover:scale-105 active:scale-95 shadow-lg shadow-[#FA243C]/30'
              }`}
            >
              {quota.isExhausted ? 'Limit Reached' : 'Start Listening'}
            </button>
            <p className="text-white/30 text-xs">
              {quota.remaining}/{300} identifications left this month
            </p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-[#FA243C]/10 border border-[#FA243C]/20 flex items-center justify-center">
              <Mic size={40} className="text-[#FA243C]" />
            </div>
            <div>
              <p className="text-white/90 font-medium text-lg sm:text-base mb-1">
                Sing or say the song title
              </p>
              <p className="text-white/40 text-sm">
                We'll transcribe your voice and search for matches
              </p>
            </div>
            <button
              onClick={onSpeechStart}
              className="px-8 py-3 rounded-full bg-[#FA243C] text-white font-bold text-sm hover:bg-[#FA243C]/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#FA243C]/30"
            >
              Start Speaking
            </button>
            <p className="text-white/30 text-xs">Unlimited • Free forever</p>
          </>
        )}
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative w-32 h-32 sm:w-28 sm:h-28 flex items-center justify-center">
          {/* Pulsing rings */}
          <div className="absolute inset-0 rounded-full bg-[#FA243C]/5 identify-pulse-ring" />
          <div className="absolute inset-2 rounded-full bg-[#FA243C]/8 identify-pulse-ring" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-4 rounded-full bg-[#FA243C]/12 identify-pulse-ring" style={{ animationDelay: '0.6s' }} />

          <div className="relative w-16 h-16 sm:w-16 sm:h-16 rounded-full bg-[#FA243C] flex items-center justify-center shadow-lg shadow-[#FA243C]/40">
            {mode === 'audd' ? (
              <AudioLines size={28} className="text-white" />
            ) : (
              <Mic size={28} className="text-white" />
            )}
          </div>
        </div>

        <div>
          <p className="text-white font-semibold text-lg">
            {mode === 'audd' ? 'Listening...' : 'Speak now...'}
          </p>
          {mode === 'audd' && recorder.secondsLeft > 0 && (
            <p className="text-[#FA243C] font-mono text-3xl font-bold mt-1">
              {recorder.secondsLeft}s
            </p>
          )}
          {mode === 'speech' && speech.transcript && (
            <p className="text-white/60 text-sm mt-2 max-w-[280px] italic">
              &ldquo;{speech.transcript}&rdquo;
            </p>
          )}
        </div>

        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-full border border-white/20 text-white/60 text-sm hover:bg-white/5 transition-all"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (state === 'processing') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 size={40} className="text-[#FA243C] animate-spin" />
        <p className="text-white/80 font-medium">
          {mode === 'audd' ? 'Identifying song...' : `Searching for "${speech.transcript}"...`}
        </p>
      </div>
    );
  }

  if (state === 'no-match') {
    return (
      <div className="flex flex-col items-center gap-4 text-center identify-result-enter">
        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-white/[0.06] flex items-center justify-center">
          <Music2 size={24} className="text-white/30" />
        </div>
        <div>
          <p className="text-white/80 font-medium mb-1 text-lg sm:text-base">Couldn't identify this song</p>
          {rawMatch?.title && (
            <p className="text-white/40 text-xs mb-2">
              Heard something like: &ldquo;{rawMatch.title}&rdquo;{rawMatch.artist ? ` by ${rawMatch.artist}` : ''}
            </p>
          )}
          <p className="text-white/40 text-sm">
            {mode === 'audd'
              ? 'Try holding your mic closer, or use "Sing/Say" mode.'
              : 'Try saying the song title more clearly.'}
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 text-center identify-result-enter">
        <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <p className="text-white/70 text-sm max-w-[280px]">{errorMessage}</p>
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
