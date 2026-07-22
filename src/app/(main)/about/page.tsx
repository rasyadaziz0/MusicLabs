import { Metadata } from 'next';
import { Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About - AcadMusic',
};

export default function AboutPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 pb-16">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Info size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-display)]">
            About AcadMusic
          </h1>
        </div>
      </header>

      <section className="space-y-6 text-white/70 leading-relaxed">
        <div className="space-y-3">
          <p>
            AcadMusic is a modern, lightweight music streaming application built as a passion project. 
            It aims to provide an ad-free, immersive, and fast listening experience by leveraging public APIs for music discovery.
          </p>
          <p>
            Features include real-time synchronized lyrics, a personalized AI-powered Discover Weekly playlist, 
            live global radio stations, and seamless background playback on mobile devices.
          </p>
          <p className="pt-4 text-white/50 text-sm">
            Version 1.0.0 (Beta) <br/>
            Made with ❤️ using Next.js & Supabase.
          </p>
        </div>
      </section>
    </article>
  );
}
