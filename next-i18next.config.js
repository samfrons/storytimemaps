/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'he', 'yi', 'yi-Hebr'],
    localeDetection: true,
  },
  fallbackLng: 'en',
  // This is important for client-side hydration
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Support for namespaces
  ns: ['common', 'business'],
  defaultNS: 'common',
  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  // Detection order: query string -> cookie -> localStorage -> browser
  detection: {
    order: ['querystring', 'cookie', 'localStorage', 'navigator'],
    caches: ['localStorage', 'cookie'],
    lookupQuerystring: 'lang',
    lookupCookie: 'i18next',
    lookupLocalStorage: 'storymap-language',
  },
  // React options
  react: {
    useSuspense: false, // Important for SSR
  },
  // Debug in development
  debug: process.env.NODE_ENV === 'development',
  // Server-side translations
  serializeConfig: false,
  // Resources will be loaded from public/locales
  localePath: typeof window === 'undefined' 
    ? require('path').resolve('./public/locales')
    : '/locales',
}