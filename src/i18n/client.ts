import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations directly for instant loading (no async delay)
import enCommon from '../../public/locales/en/common.json'
import enBusiness from '../../public/locales/en/business.json'
import deCommon from '../../public/locales/de/common.json'
import deBusiness from '../../public/locales/de/business.json'
import yiCommon from '../../public/locales/yi/common.json'
import yiBusiness from '../../public/locales/yi/business.json'

// Bundled resources for instant loading
const resources = {
  en: { common: enCommon, business: enBusiness },
  de: { common: deCommon, business: deBusiness },
  yi: { common: yiCommon, business: yiBusiness },
}

// Initialize i18next synchronously with bundled resources
if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .init({
      resources,
      // German is the site's default language: this is a German-language memorial
      // project about Berlin, so an unconfigured visitor should land in German.
      // A key missing from de/yi therefore degrades to German, not English.
      //
      // This is fallbackLng rather than lng: setting lng would switch the language
      // detector off entirely, throwing away a visitor's ?lang= and stored choice.
      // With detection finding nothing, i18next lands on fallbackLng — German.
      fallbackLng: 'de',
      defaultNS: 'common',
      ns: ['common', 'business'],
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        // 'navigator' is deliberately absent. With it, an English browser would be
        // detected as 'en' on the client while the server (see i18n/useTranslationNew.ts)
        // has no navigator to read and renders 'de' — a hydration mismatch, and a visitor
        // who never chose English would silently override the site's German default.
        // Language now comes only from an explicit choice: ?lang= or a stored preference.
        order: ['querystring', 'localStorage'],
        caches: ['localStorage'],
        lookupQuerystring: 'lang',
        lookupLocalStorage: 'storymap-language',
      },
      supportedLngs: ['en', 'de', 'yi'],
      react: {
        useSuspense: false,
      },
    })
}

export default i18next
