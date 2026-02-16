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
    })
}

export default i18next
