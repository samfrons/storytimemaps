'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

const runsOnServerSide = typeof window === 'undefined';

// Only initialize on client side
if (!runsOnServerSide) {
  i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(
      resourcesToBackend((language: string, namespace: string) => 
        import(`../../public/locales/${language}/${namespace}.json`)
      )
    )
    .init({
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common', 'business'],
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['querystring', 'localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupQuerystring: 'lang',
        lookupLocalStorage: 'storymap-language',
      },
      supportedLngs: ['en', 'de', 'yi'],
      react: {
        useSuspense: false,
      },
      // Preload English to ensure it's available immediately
      preload: ['en'],
    });
}

export default i18next;