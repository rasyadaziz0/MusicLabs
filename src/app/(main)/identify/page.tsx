'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useIdentifyController } from '@/hooks/useIdentifyController';

// Components
import { AnimatedBackground } from '@/components/identify/AnimatedBackground';
import { TopNavigation } from '@/components/identify/TopNavigation';
import { AuthGate } from '@/components/identify/AuthGate';
import { MainIdentifyButton } from '@/components/identify/MainIdentifyButton';
import { ResultsBottomSheet } from '@/components/identify/ResultsBottomSheet';

export default function IdentifyPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;

  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

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

  // Redirect to modal on desktop
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsDesktop(true);
      router.replace('/?modal=identify');
    } else {
      setIsDesktop(false);
    }
  }, [router]);

  if (isDesktop === null || isDesktop === true) {
    return null;
  }

  const isRecordingOrProcessing = state === 'recording' || state === 'processing';
  const hasResults = state === 'results' || state === 'no-match' || state === 'error';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#000000] relative overflow-hidden text-white font-sans selection:bg-white/30">
      
      <AnimatedBackground isRecordingOrProcessing={isRecordingOrProcessing} />

      <TopNavigation 
        mode={mode} 
        setMode={setMode} 
        isSpeechSupported={speech.isSupported} 
      />

      {/* ── Main Content Area ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {!authLoading && !isAuthenticated ? (
          <AuthGate signInWithGoogle={signInWithGoogle} />
        ) : (
          <>
            <MainIdentifyButton
              mode={mode}
              state={state}
              quota={quota}
              recorder={recorder}
              speech={speech}
              handleAuddIdentify={handleAuddIdentify}
              handleSpeechStart={handleSpeechStart}
              handleCancel={handleCancel}
            />

            <ResultsBottomSheet
              hasResults={hasResults}
              state={state}
              mode={mode}
              matchedSong={matchedSong}
              rawMatch={rawMatch}
              speechResults={speechResults}
              errorMessage={errorMessage}
              speech={speech}
              resetState={resetState}
              handlePlay={handlePlay}
              handleSearchForSong={handleSearchForSong}
              routerBack={() => router.back()}
            />
          </>
        )}
      </main>
    </div>
  );
}
