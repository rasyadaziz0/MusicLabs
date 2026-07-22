import { Metadata } from 'next';
import { Code2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Open Source - AcadMusic',
};

export default function OSSPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-8 pb-16">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Code2 size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-[family-name:var(--font-display)]">
            Open Source
          </h1>
        </div>
      </header>

      <section className="space-y-6 text-white/70 leading-relaxed">
        <div className="space-y-3">
          <p>
            AcadMusic is made possible by the incredible open-source community. 
            We use the following major libraries and technologies under their respective licenses:
          </p>
          <ul className="space-y-2 list-disc list-inside mt-4">
            <li><strong>Next.js</strong> (MIT) - React Framework</li>
            <li><strong>Tailwind CSS</strong> (MIT) - Utility-first styling</li>
            <li><strong>Framer Motion</strong> (MIT) - Animations</li>
            <li><strong>GSAP</strong> (Standard) - Scroll and entrance animations</li>
            <li><strong>Supabase</strong> (Apache 2.0) - Database & Auth</li>
            <li><strong>Lucide React</strong> (ISC) - Icons</li>
          </ul>
        </div>
      </section>
    </article>
  );
}
