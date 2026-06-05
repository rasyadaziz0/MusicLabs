import { Suspense } from 'react';
import RegisterForm from '@/components/auth/RegisterForm';

// Export default pakai Suspense untuk wrap useSearchParams()
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen gradient-mesh flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/80 backdrop-blur-xl p-8 shadow-2xl animate-pulse">
          <div className="h-8 bg-white/10 rounded-xl mb-4" />
          <div className="h-4 bg-white/5 rounded-xl mb-8 w-3/4 mx-auto" />
          <div className="space-y-4">
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-white/5 rounded-xl" />
            <div className="h-11 bg-primary/30 rounded-xl" />
          </div>
        </div>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
