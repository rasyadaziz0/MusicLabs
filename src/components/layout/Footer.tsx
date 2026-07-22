import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-5 border-t border-white/10 pt-8 pb-40 md:pb-32 flex flex-col text-left">
      <div className="text-[11px] text-white/50 space-y-4">
        {/* Language selector placeholder */}
        <div className="flex items-center gap-2 font-medium">
          <span className="text-white/80">Indonesia (English)</span>
          <span className="text-white/30">|</span>
          <span className="hover:text-white/80 cursor-pointer transition-colors">Bahasa Indonesia</span>
        </div>

        <p className="pt-2">
          Copyright &copy; {currentYear} AcadMusic. All rights reserved.
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <Link href="/terms" className="hover:text-white/80 transition-colors">Internet Service Terms</Link>
          <span className="text-white/30">|</span>
          <Link href="/privacy" className="hover:text-white/80 transition-colors">AcadMusic &amp; Privacy</Link>
          <span className="text-white/30">|</span>
          <Link href="/cookies" className="hover:text-white/80 transition-colors">Cookie Warning</Link>
          <span className="text-white/30">|</span>
          <a href="mailto:dmca@music.rasyadazizan.site" className="hover:text-white/80 transition-colors">Support</a>
          <span className="text-white/30">|</span>
          <Link href="/dmca" className="hover:text-white/80 transition-colors">Feedback &amp; DMCA</Link>
          <span className="text-white/30">|</span>
          <Link href="/about" className="hover:text-white/80 transition-colors">About</Link>
          <span className="text-white/30">|</span>
          <Link href="/oss" className="hover:text-white/80 transition-colors">Open Source</Link>
        </div>
      </div>
    </footer>
  );
}
