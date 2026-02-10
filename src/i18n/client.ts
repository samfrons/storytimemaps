import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

const runsOnServerSide = typeof window === 'undefined'

// Initialize i18next with initReactI18next on both server and client
// This prevents the "NO_I18NEXT_INSTANCE" warning
i18next.use(initReactI18next)

// Only add browser-specific plugins on client side
if (!runsOnServerSide) {
  // Dynamically import browser-specific plugins
  Promise.all([
    import('i18next-browser-languagedetector'),
    import('i18next-resources-to-backend'),
  ]).then(([LanguageDetector, resourcesToBackend]) => {
    if (!i18next.isInitialized) {
      i18next
        .use(LanguageDetector.default)
        .use(
          resourcesToBackend.default(
            (language: string, namespace: string) =>
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
          preload: ['en'],
        })
    }
  })
} else {
  // Server-side: Initialize with minimal config and empty resources
  if (!i18next.isInitialized) {
    i18next.init({
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common', 'business'],
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      supportedLngs: ['en', 'de', 'yi'],
      react: {
        useSuspense: false,
      },
      resources: {
        en: { common: {}, business: {} },
        de: { common: {}, business: {} },
        yi: { common: {}, business: {} },
      },
    })
  }
}

export default i18next
