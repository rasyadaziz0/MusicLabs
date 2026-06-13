'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/i18n/locales/en.json';
import id from '@/i18n/locales/id.json';
import jp from '@/i18n/locales/jp.json';
import kr from '@/i18n/locales/kr.json';
import es from '@/i18n/locales/es.json';
import fr from '@/i18n/locales/fr.json';

const dictionaries: Record<string, any> = {
  en,
  id,
  jp,
  kr,
  es,
  fr,
};

type LanguageContextType = {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('id');

  useEffect(() => {
    const saved = localStorage.getItem('ui_locale');
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
    } else {
      // Default to user's browser language if possible, else ID
      const browserLang = navigator.language.split('-')[0];
      if (dictionaries[browserLang]) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  const setLocale = (newLocale: string) => {
    if (dictionaries[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem('ui_locale', newLocale);
    }
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let current = dictionaries[locale] || dictionaries['en'];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to English
        let fallback = dictionaries['en'];
        for (const k of keys) {
          if (fallback[k] === undefined) return path;
          fallback = fallback[k];
        }
        return fallback;
      }
      current = current[key];
    }
    
    return current;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
