'use client';

import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';

/**
 * Enhanced translation hook using react-i18next directly
 * Maintains compatibility with existing codebase while leveraging i18next features
 */
export const useTranslation = () => {
  // Always call the hook, but handle server/client differently in the t function
  const { t: i18nextT, i18n } = useI18nextTranslation(['common', 'business']);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current language - support en, de, yi
  const language = (['de', 'yi'].includes(i18n.language) ? i18n.language : 'en') as 'en' | 'de' | 'yi';

  // Switch to specific language
  const switchToLanguage = useCallback((targetLang: 'en' | 'de' | 'yi') => {
    if (targetLang === language) return;
    
    // Change i18next language
    i18n.changeLanguage(targetLang);
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('storymap-language', targetLang);
    }
    
    // Update URL if there's a lang param
    const currentParams = new URLSearchParams(searchParams.toString());
    if (currentParams.has('lang')) {
      currentParams.set('lang', targetLang);
      router.push(`${pathname}?${currentParams.toString()}`);
    }
  }, [language, i18n, router, pathname, searchParams]);

  // Legacy toggle function - cycles through languages
  const toggleLanguage = useCallback((targetLang?: string) => {
    if (targetLang && ['en', 'de', 'yi'].includes(targetLang)) {
      switchToLanguage(targetLang as 'en' | 'de' | 'yi');
    } else {
      // Cycle through: en -> de -> yi -> en
      const nextLang = language === 'en' ? 'de' : language === 'de' ? 'yi' : 'en';
      switchToLanguage(nextLang);
    }
  }, [language, switchToLanguage]);

  // Enhanced t function with namespace support and SSR safety
  const t = useCallback((path: string, options?: { ns?: string; defaultValue?: string; [key: string]: any }): string => {
    // On server side or before i18next is ready, return default values to prevent hydration mismatch
    if (typeof window === 'undefined' || !i18n || !i18n.isInitialized) {
      // Return static English fallbacks for SSR consistency
      const englishFallbacks: Record<string, string> = {
        'mainPage.intro.title': 'Jewish Businesses',
        'mainPage.intro.subtitle': 'Berlin 1900-1945',
        'hero.title': 'Jewish Businesses in Berlin',
        'hero.subtitle': 'A Historical Journey Through Time',
        'mainPage.storyList.searchPlaceholder': 'Search businesses...',
        'mainPage.storyList.allCategories': 'All Categories',
        'businessStates.active': 'Active',
        'businessStates.declining': 'Declining', 
        'businessStates.closed': 'Closed'
      };
      
      return englishFallbacks[path] || options?.defaultValue || path;
    }
    
    // Determine namespace from path or options
    let namespace = options?.ns || 'common';
    
    // Auto-detect namespace based on path
    const businessKeys = ['mainPage', 'businessTypes', 'businessDescriptions', 'businessStates'];
    const firstKey = path.split('.')[0];
    
    if (businessKeys.includes(firstKey)) {
      namespace = 'business';
    }
    
    // Use i18next with proper namespace
    const translation = i18nextT(path, { 
      ns: namespace, 
      defaultValue: options?.defaultValue || path,
      ...options 
    });
    
    return translation || path;
  }, [i18nextT, i18n]);

  // Sync with URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang') as 'en' | 'de' | 'yi' | null;
      
      if (langParam && ['de', 'en', 'yi'].includes(langParam)) {
        if (i18n.language !== langParam) {
          i18n.changeLanguage(langParam);
          localStorage.setItem('storymap-language', langParam);
        }
      }
    }
  }, [i18n]);

  return {
    t,
    language,
    toggleLanguage,
    switchToLanguage,
    i18n, // Expose i18next instance for advanced usage
    isReady: i18n.isInitialized && i18n.hasResourceBundle(language, 'common')
  };
};

export default useTranslation;