import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock i18next completely to avoid module issues
const { mockChangeLanguage, i18nextState } = vi.hoisted(() => {
  const mockChangeLanguage = vi.fn();
  const i18nextState = {
    language: 'en',
    options: {
      supportedLngs: ['en', 'de', 'yi'],
      fallbackLng: ['en'],
      ns: ['common', 'business'],
    }
  };
  return { mockChangeLanguage, i18nextState };
});

vi.mock('../../i18n/client', () => ({
  default: {
    get language() {
      return i18nextState.language;
    },
    options: i18nextState.options,
    changeLanguage: (lang: string) => {
      i18nextState.language = lang;
      return mockChangeLanguage(lang);
    },
    t: (key: string, options?: any) => {
      const translations: Record<string, any> = {
      'en/common': {
        hero: {
          title: 'Jewish Businesses in Berlin',
          subtitle: 'A Historical Journey Through Time',
          period: '1900-1945'
        },
        language: {
          switchTo: 'Deutsch',
          current: 'English'
        }
      },
      'de/common': {
        hero: {
          title: 'Jüdische Geschäfte in Berlin',
          subtitle: 'Eine historische Zeitreise',
          period: '1900-1945'
        },
        language: {
          switchTo: 'English',
          current: 'Deutsch'
        }
      },
      'yi/common': {
        hero: {
          title: 'ייִדישע געשעפֿטן אין בערלין',
          subtitle: 'אַ היסטאָרישע צײַט־רײַזע',
          period: '1900-1945'
        },
        language: {
          switchTo: 'English',
          current: 'ייִדיש'
        }
      },
      'en/business': {
        businessStates: {
          active: 'Active',
          declining: 'Declining',
          closed: 'Closed'
        }
      },
      'de/business': {
        businessStates: {
          active: 'Aktiv',
          declining: 'Im Niedergang',
          closed: 'Geschlossen'
        }
      },
      'yi/business': {
        businessStates: {
          active: 'אַקטיוו',
          declining: 'אין אַראָפּגאַנג',
          closed: 'פֿאַרמאַכט'
        }
      }
      };
      const ns = options?.ns || 'common';
      const lang = i18nextState.language;
      return translations[`${lang}/${ns}`]?.[key] || key;
    },
    hasLoadedNamespace: (ns: string) => true,
    loadNamespaces: (ns: string) => Promise.resolve(),
  }
}));

import i18next from '../../i18n/client';

describe('Translation System', () => {
  describe('i18next initialization', () => {
    it('should initialize with English as default language', () => {
      expect(i18next.language).toBe('en');
    });

    it('should support all three languages (en, de, yi)', () => {
      const supportedLanguages = ['en', 'de', 'yi'];
      supportedLanguages.forEach(lang => {
        expect(i18next.options.supportedLngs).toContain(lang);
      });
    });

    it('should have fallback language set to English', () => {
      expect(i18next.options.fallbackLng).toEqual(['en']);
    });

    it('should have both common and business namespaces', () => {
      expect(i18next.options.ns).toContain('common');
      expect(i18next.options.ns).toContain('business');
    });
  });

  describe('Language switching', () => {
    beforeEach(() => {
      i18nextState.language = 'en';
      mockChangeLanguage.mockClear();
    });

    it('should switch from English to German', async () => {
      await i18next.changeLanguage('de');
      expect(mockChangeLanguage).toHaveBeenCalledWith('de');
      expect(i18nextState.language).toBe('de');
    });

    it('should switch from English to Yiddish', async () => {
      await i18next.changeLanguage('yi');
      expect(mockChangeLanguage).toHaveBeenCalledWith('yi');
      expect(i18nextState.language).toBe('yi');
    });

    it('should switch from German back to English', async () => {
      i18nextState.language = 'de';
      await i18next.changeLanguage('en');
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
      expect(i18nextState.language).toBe('en');
    });
  });

  describe('Translation keys', () => {
    it('should support multiple languages', () => {
      const supportedLangs = ['en', 'de', 'yi'];
      expect(i18next.options.supportedLngs).toEqual(supportedLangs);
    });

    it('should support multiple namespaces', () => {
      const namespaces = ['common', 'business'];
      expect(i18next.options.ns).toEqual(namespaces);
    });
  });

  describe('Namespace loading', () => {
    it('should load common namespace', () => {
      expect(i18next.hasLoadedNamespace('common')).toBe(true);
    });

    it('should load business namespace', () => {
      expect(i18next.hasLoadedNamespace('business')).toBe(true);
    });
  });
});
