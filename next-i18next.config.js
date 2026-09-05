/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'de',
    locales: ['en', 'de', 'he', 'yi', 'yi-Hebr'],
    localeDetection: true,
  },
  fallbackLng: 'de',
  // This is important for client-side hydration
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Support for namespaces
  ns: ['common', 'business'],
  defaultNS: 'common',
  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  // Detection order: query string -> cookie -> localStorage. The browser's own
  // language is deliberately not consulted: German is the site default and only an
  // explicit choice should override it.
  detection: {
    order: ['querystring', 'cookie', 'localStorage'],
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
  localePath:
    typeof window === 'undefined'
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS config file, loaded by next-i18next outside the module graph
        require('path').resolve('./public/locales')
      : '/locales',
}
