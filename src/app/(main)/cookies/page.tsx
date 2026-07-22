import { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy - AcadMusic',
};

export default function CookiePolicyPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 pb-16">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-display)]">
            Cookie Policy
          </h1>
        </div>
        <p className="text-white/50 text-sm">Last updated: July 2026</p>
      </header>

      <section className="space-y-6 text-white/70 leading-relaxed">
        <div className="space-y-3">
          <p>
            We use essential cookies to maintain your login session (via Supabase Auth) and store basic local preferences 
            like your selected language or search region. 
          </p>
          <p>
            We do not use any third-party tracking or advertising cookies. Your listening habits are kept strictly for 
            your own Discover Weekly and Recap features.
          </p>
        </div>
      </section>
    </article>
  );
}
