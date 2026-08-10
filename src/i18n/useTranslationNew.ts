'use client'

import { useTranslation as useI18nextTranslation } from 'react-i18next'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect } from 'react'

// Same modules i18n/client.ts already bundles, so referencing them here adds no bundle weight.
// They exist so the server can resolve a key against the REAL translations instead of guessing.
import enCommon from '../../public/locales/en/common.json'
import enBusiness from '../../public/locales/en/business.json'
import deCommon from '../../public/locales/de/common.json'
import deBusiness from '../../public/locales/de/business.json'
import yiCommon from '../../public/locales/yi/common.json'
import yiBusiness from '../../public/locales/yi/business.json'

const BUNDLED_RESOURCES: Record<string, Record<string, unknown>> = {
  en: { common: enCommon, business: enBusiness },
  de: { common: deCommon, business: deBusiness },
  yi: { common: yiCommon, business: yiBusiness },
}

// Namespace routing must be identical on both sides of hydration, so it lives in one place
// used by both the SSR branch and the i18next branch below.
const BUSINESS_NAMESPACE_ROOTS = [
  'mainPage',
  'businessTypes',
  'businessDescriptions',
  'businessStates',
]

const detectNamespace = (path: string, explicitNs?: string): string => {
  if (explicitNs) return explicitNs
  return BUSINESS_NAMESPACE_ROOTS.includes(path.split('.')[0]) ? 'business' : 'common'
}

const resolveFromBundle = (lang: string, namespace: string, path: string): string | undefined => {
  const bundle = BUNDLED_RESOURCES[lang]?.[namespace]
  if (!bundle) return undefined
  const value = path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined,
      bundle
    )
  return typeof value === 'string' ? value : undefined
}

/**
 * Enhanced translation hook using react-i18next directly
 * Maintains compatibility with existing codebase while leveraging i18next features
 */
export const useTranslation = () => {
  // Always call the hook, but handle server/client differently in the t function
  const { t: i18nextT, i18n } = useI18nextTranslation(['common', 'business'])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get current language - support en, de, yi
  // Ensure consistent language detection between server and client
  const getLanguage = (): 'en' | 'de' | 'yi' => {
    // Check URL params first for SSR consistency
    const urlLang = searchParams.get('lang')
    if (urlLang && ['en', 'de', 'yi'].includes(urlLang)) {
      return urlLang as 'en' | 'de' | 'yi'
    }

    // Fall back to i18n.language if available and valid
    if (i18n && i18n.language && ['de', 'yi'].includes(i18n.language)) {
      return i18n.language as 'en' | 'de' | 'yi'
    }

    // Default to English for SSR consistency
    return 'en'
  }

  const language = getLanguage()

  // Switch to specific language
  const switchToLanguage = useCallback(
    (targetLang: 'en' | 'de' | 'yi') => {
      if (targetLang === language) return

      // Change i18next language
      i18n.changeLanguage(targetLang)

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('storymap-language', targetLang)
      }

      // Update URL if there's a lang param
      const currentParams = new URLSearchParams(searchParams.toString())
      if (currentParams.has('lang')) {
        currentParams.set('lang', targetLang)
        router.push(`${pathname}?${currentParams.toString()}`)
      }
    },
    [language, i18n, router, pathname, searchParams]
  )

  // Legacy toggle function - cycles through languages
  const toggleLanguage = useCallback(
    (targetLang?: string) => {
      if (targetLang && ['en', 'de', 'yi'].includes(targetLang)) {
        switchToLanguage(targetLang as 'en' | 'de' | 'yi')
      } else {
        // Cycle through: en -> de -> yi -> en
        const nextLang = language === 'en' ? 'de' : language === 'de' ? 'yi' : 'en'
        switchToLanguage(nextLang)
      }
    },
    [language, switchToLanguage]
  )

  // Enhanced t function with namespace support and SSR safety
  const t = useCallback(
    (
      path: string,
      options?: { ns?: string; defaultValue?: string; [key: string]: any }
    ): string => {
      const namespace = detectNamespace(path, options?.ns)

      // On the server, and on the client before i18next finishes initialising, resolve against the
      // bundled translation files rather than a hand-maintained fallback list.
      //
      // The old implementation carried a 9-entry `englishFallbacks` map and returned `path` for
      // everything else, so any key outside those nine rendered as a raw key on the server
      // ("mainPage.intro.description1") and as real text on the client - a guaranteed hydration
      // mismatch plus a visible flash of key names on first paint.
      //
      // `language` comes from the ?lang= search param, which is available during SSR in the App
      // Router, so the server can resolve the SAME language the client will use and the two agree.
      if (typeof window === 'undefined' || !i18n || !i18n.isInitialized) {
        const fromRequestedLanguage = resolveFromBundle(language, namespace, path)
        if (fromRequestedLanguage !== undefined) return fromRequestedLanguage

        // Mirror i18next's own fallbackLng: 'en' so a key missing from de/yi degrades to English
        // rather than to its own name.
        const fromEnglish = resolveFromBundle('en', namespace, path)
        if (fromEnglish !== undefined) return fromEnglish

        return options?.defaultValue || path
      }

      // Use i18next with proper namespace
      const translation = i18nextT(path, {
        ns: namespace,
        defaultValue: options?.defaultValue || path,
        ...options,
      })

      return translation || path
      // `language` is a real dependency now: the SSR branch resolves against that language's
      // bundle, so omitting it would pin t() to the language present on first render.
    },
    [i18nextT, i18n, language]
  )

  // Sync with URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const langParam = urlParams.get('lang') as 'en' | 'de' | 'yi' | null

      if (langParam && ['de', 'en', 'yi'].includes(langParam)) {
        if (i18n.language !== langParam) {
          i18n.changeLanguage(langParam)
          localStorage.setItem('storymap-language', langParam)
        }
      }
    }
  }, [i18n])

  return {
    t,
    language,
    toggleLanguage,
    switchToLanguage,
    i18n, // Expose i18next instance for advanced usage
    isReady: i18n.isInitialized && i18n.hasResourceBundle(language, 'common'),
  }
}

export default useTranslation
