'use client';

import { useTranslation } from '@/context/LanguageContext';
import { Home, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function FeatureDisabled() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
        <div className="glass rounded-3xl p-8 text-center border border-white/10 shadow-2xl relative overflow-hidden">
          
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white/50 shadow-inner">
              <ShieldAlert size={32} />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
              Fitur Sedang Dimatikan
            </h1>
            
            <p className="text-sm text-white/60 mb-8 leading-relaxed max-w-[280px]">
              Maaf, fitur ini sedang dalam perbaikan atau sementara dinonaktifkan oleh sistem.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link 
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(250,36,60,0.3)]"
              >
                <Home size={16} />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
