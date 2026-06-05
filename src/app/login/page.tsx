import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

// Export default pakai Suspense untuk wrap useSearchParams()
// Ini WAJIB di Next.js App Router — tanpa ini terjadi hydration mismatch
export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl mb-4" />
          <div className="h-4 bg-white/5 rounded-xl mb-8 w-3/4 mx-auto" />
          <div className="space-y-4">
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-primary/30 rounded-xl" />
          </div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
