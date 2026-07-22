import Link from 'next/link';
import { Info, FileText, Shield, ExternalLink, Cookie, Scale, Code2, Mail, BookOpen } from 'lucide-react';
import { SectionHeader } from './SettingsUI';

export function AboutSettings({ t }: { t: (key: string) => string }) {
  const iconClass = "text-[#FA243C]"; // Matching the primary color used in other settings

  return (
    <>
      <SectionHeader title="About AcadMusic" />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden mb-8">
        
        {/* Version */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04]">
          <span className="flex items-center gap-3 text-[14px] text-white/80 font-medium">
            <Info size={18} className={iconClass} />
            Version
          </span>
          <span className="text-[13px] text-white/40">v1.0.0 (Beta)</span>
        </div>

        {/* Terms of Use */}
        <Link 
          href="/terms"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] group cursor-pointer"
        >
          <span className="flex items-center gap-3 text-[14px] text-white/80">
            <FileText size={18} className={iconClass} />
            Terms of Use
          </span>
          <ExternalLink size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
        </Link>

        {/* Privacy Policy */}
        <Link 
          href="/privacy"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] group cursor-pointer"
        >
          <span className="flex items-center gap-3 text-[14px] text-white/80">
            <Shield size={18} className={iconClass} />
            Privacy Policy
          </span>
          <ExternalLink size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
        </Link>

        {/* Cookie Policy */}
        <Link 
          href="/cookies"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] group cursor-pointer"
        >
          <span className="flex items-center gap-3 text-[14px] text-white/80">
            <Cookie size={18} className={iconClass} />
            Cookie Policy
          </span>
          <ExternalLink size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
        </Link>

        {/* Copyright / DMCA */}
        <Link 
          href="/dmca"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] group cursor-pointer"
        >
          <span className="flex items-center gap-3 text-[14px] text-white/80">
            <Scale size={18} className={iconClass} />
            Copyright / DMCA
          </span>
          <ExternalLink size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
        </Link>

        {/* Open Source Licenses */}
        <Link 
          href="/oss"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] group cursor-pointer"
        >
          <span className="flex items-center gap-3 text-[14px] text-white/80">
            <Code2 size={18} className={iconClass} />
            Open Source Licenses
          </span>
          <ExternalLink size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
        </Link>

        {/* About AcadMusic */}
        <Link 
          href="/about"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] group cursor-pointer"
        >
          <span className="flex items-center gap-3 text-[14px] text-white/80">
            <BookOpen size={18} className={iconClass} />
            About AcadMusic
          </span>
          <ExternalLink size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
        </Link>

        {/* Contact Support */}
        <a 
          href="mailto:dmca@music.rasyadazizan.site"
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
        >
          <span className="flex items-center gap-3 text-[14px] text-white/80">
            <Mail size={18} className={iconClass} />
            Contact Support
          </span>
          <ExternalLink size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
        </a>
      </div>
    </>
  );
}
