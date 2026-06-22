'use client';

import { useAuth } from '@/context/AuthContext';
import { useIdentifyController } from '@/hooks/useIdentifyController';
import { AppleMusicIdentifyLayout } from '@/components/identify/AppleMusicIdentifyLayout';
import { AuthGate } from '@/components/identify/AuthGate';

export default function IdentifyPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const isAuthenticated = !!user;

  const controller = useIdentifyController();

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-hidden text-white font-sans selection:bg-white/30">
      {!authLoading && !isAuthenticated ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <AuthGate signInWithGoogle={signInWithGoogle} />
        </div>
      ) : (
        <AppleMusicIdentifyLayout
          mode={controller.mode}
          setMode={controller.setMode}
          state={controller.state}
          matchedSong={controller.matchedSong}
          rawMatch={controller.rawMatch}
          speechResults={controller.speechResults}
          errorMessage={controller.errorMessage}
          recorder={controller.recorder}
          speech={controller.speech}
          quota={controller.quota}
          handleAuddIdentify={controller.handleAuddIdentify}
          handleSpeechStart={controller.handleSpeechStart}
          handlePlay={controller.handlePlay}
          handleSearchForSong={controller.handleSearchForSong}
          handleCancel={controller.handleCancel}
          resetState={controller.resetState}
        />
      )}
    </div>
  );
}


