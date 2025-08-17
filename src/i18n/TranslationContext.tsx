'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { translations, Language } from './translations';

interface TranslationContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (path: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);
    
    // First priority: URL parameter
    const langParam = searchParams.get('lang');
    if (langParam === 'de' || langParam === 'en') {
      setLanguage(langParam);
      localStorage.setItem('storymap-language', langParam);
    } else {
      // Second priority: localStorage
      const savedLang = localStorage.getItem('storymap-language') as Language;
      if (savedLang && (savedLang === 'en' || savedLang === 'de')) {
        setLanguage(savedLang);
      } else {
        // Third priority: browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('de')) {
          setLanguage('de');
        }
      }
    }
  }, [searchParams]);

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'en' ? 'de' : 'en';
    setLanguage(newLang);
    localStorage.setItem('storymap-language', newLang);
  }, [language]);

  const t = useCallback((path: string): string => {
    const keys = path.split('.');
    let value: unknown = translations[language];
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = (value as Record<string, unknown>)[k];
          } else {
            return path; // Return path if translation not found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : path;
  }, [language]);

  // Prevent hydration mismatch by using default language until client-side
  const contextValue = {
    language: isClient ? language : 'en',
    toggleLanguage,
    t
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};