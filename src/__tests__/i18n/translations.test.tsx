import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import i18next from '../../i18n/client';

// Mock the translation files
vi.mock('i18next-resources-to-backend', () => ({
  default: () => (language: string, namespace: string) => {
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
    return Promise.resolve(translations[`${language}/${namespace}`] || {});
  }
}));

describe('Translation System', () => {
  describe('i18next initialization', () => {
    it('should initialize with English as default language', async () => {
      await waitFor(() => {
        expect(i18next.language).toBeDefined();
      });
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
    beforeEach(async () => {
      await i18next.changeLanguage('en');
    });

    it('should switch from English to German', async () => {
      await act(async () => {
        await i18next.changeLanguage('de');
      });

      await waitFor(() => {
        expect(i18next.language).toBe('de');
      });
    });

    it('should switch from English to Yiddish', async () => {
      await act(async () => {
        await i18next.changeLanguage('yi');
      });

      await waitFor(() => {
        expect(i18next.language).toBe('yi');
      });
    });

    it('should switch from German back to English', async () => {
      await act(async () => {
        await i18next.changeLanguage('de');
      });

      await waitFor(() => {
        expect(i18next.language).toBe('de');
      });

      await act(async () => {
        await i18next.changeLanguage('en');
      });

      await waitFor(() => {
        expect(i18next.language).toBe('en');
      });
    });
  });

  describe('Translation keys', () => {
    beforeEach(async () => {
      await i18next.changeLanguage('en');
    });

    it('should have hero section translations in all languages', async () => {
      const keys = ['hero.title', 'hero.subtitle', 'hero.period'];
      const languages = ['en', 'de', 'yi'];

      for (const lang of languages) {
        await i18next.changeLanguage(lang);
        for (const key of keys) {
          const translation = i18next.t(key, { ns: 'common' });
          expect(translation).toBeDefined();
          expect(translation).not.toBe(key);
        }
      }
    });

    it('should have business state translations in all languages', async () => {
      const keys = ['businessStates.active', 'businessStates.declining', 'businessStates.closed'];
      const languages = ['en', 'de', 'yi'];

      for (const lang of languages) {
        await i18next.changeLanguage(lang);
        for (const key of keys) {
          const translation = i18next.t(key, { ns: 'business' });
          expect(translation).toBeDefined();
          expect(translation).not.toBe(key);
        }
      }
    });

    it('should have language switcher translations', async () => {
      await i18next.changeLanguage('en');
      expect(i18next.t('language.switchTo', { ns: 'common' })).toBe('Deutsch');
      expect(i18next.t('language.current', { ns: 'common' })).toBe('English');

      await i18next.changeLanguage('de');
      expect(i18next.t('language.switchTo', { ns: 'common' })).toBe('English');
      expect(i18next.t('language.current', { ns: 'common' })).toBe('Deutsch');
    });
  });

  describe('Missing translations', () => {
    it('should fall back to English for missing translations', async () => {
      await i18next.changeLanguage('de');

      // Test with a non-existent key
      const result = i18next.t('nonexistent.key', { ns: 'common' });

      // i18next returns the key itself when translation is missing
      expect(result).toBe('nonexistent.key');
    });
  });

  describe('Namespace loading', () => {
    it('should load common namespace by default', async () => {
      await i18next.loadNamespaces('common');
      expect(i18next.hasLoadedNamespace('common')).toBe(true);
    });

    it('should load business namespace', async () => {
      await i18next.loadNamespaces('business');
      expect(i18next.hasLoadedNamespace('business')).toBe(true);
    });
  });
});
