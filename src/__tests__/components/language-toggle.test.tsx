import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the translation hook
const mockSwitchToLanguage = vi.fn();
let mockLanguage = 'en';

vi.mock('../../i18n/useTranslation', () => ({
  useTranslation: () => ({
    language: mockLanguage,
    switchToLanguage: (lang: string) => {
      mockLanguage = lang;
      mockSwitchToLanguage(lang);
    },
    t: (key: string) => key,
  }),
}));

// Simple language toggle component for testing
const LanguageToggle: React.FC = () => {
  const { useTranslation } = require('../../i18n/useTranslation');
  const { language, switchToLanguage } = useTranslation();

  return (
    <div data-testid="language-toggle">
      <p data-testid="current-language">Current: {language}</p>
      <button
        data-testid="switch-to-en"
        onClick={() => switchToLanguage('en')}
      >
        English
      </button>
      <button
        data-testid="switch-to-de"
        onClick={() => switchToLanguage('de')}
      >
        Deutsch
      </button>
      <button
        data-testid="switch-to-yi"
        onClick={() => switchToLanguage('yi')}
      >
        ייִדיש
      </button>
    </div>
  );
};

describe('Language Toggle Component', () => {
  beforeEach(() => {
    mockLanguage = 'en';
    mockSwitchToLanguage.mockClear();
  });

  describe('Initial state', () => {
    it('should render language toggle buttons', () => {
      render(<LanguageToggle />);

      expect(screen.getByTestId('switch-to-en')).toBeInTheDocument();
      expect(screen.getByTestId('switch-to-de')).toBeInTheDocument();
      expect(screen.getByTestId('switch-to-yi')).toBeInTheDocument();
    });

    it('should display current language as English', () => {
      render(<LanguageToggle />);

      expect(screen.getByTestId('current-language')).toHaveTextContent('Current: en');
    });
  });

  describe('Language switching', () => {
    it('should switch to German when Deutsch button is clicked', async () => {
      render(<LanguageToggle />);

      const deutschButton = screen.getByTestId('switch-to-de');
      fireEvent.click(deutschButton);

      await waitFor(() => {
        expect(mockSwitchToLanguage).toHaveBeenCalledWith('de');
      });
    });

    it('should switch to Yiddish when Yiddish button is clicked', async () => {
      render(<LanguageToggle />);

      const yiddishButton = screen.getByTestId('switch-to-yi');
      fireEvent.click(yiddishButton);

      await waitFor(() => {
        expect(mockSwitchToLanguage).toHaveBeenCalledWith('yi');
      });
    });

    it('should switch back to English when English button is clicked', async () => {
      mockLanguage = 'de';
      render(<LanguageToggle />);

      const englishButton = screen.getByTestId('switch-to-en');
      fireEvent.click(englishButton);

      await waitFor(() => {
        expect(mockSwitchToLanguage).toHaveBeenCalledWith('en');
      });
    });

    it('should handle multiple language switches', async () => {
      render(<LanguageToggle />);

      fireEvent.click(screen.getByTestId('switch-to-de'));
      await waitFor(() => expect(mockSwitchToLanguage).toHaveBeenCalledWith('de'));

      fireEvent.click(screen.getByTestId('switch-to-yi'));
      await waitFor(() => expect(mockSwitchToLanguage).toHaveBeenCalledWith('yi'));

      fireEvent.click(screen.getByTestId('switch-to-en'));
      await waitFor(() => expect(mockSwitchToLanguage).toHaveBeenCalledWith('en'));

      expect(mockSwitchToLanguage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<LanguageToggle />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);

      buttons.forEach(button => {
        expect(button.textContent).toBeTruthy();
      });
    });

    it('should be keyboard navigable', () => {
      render(<LanguageToggle />);

      const deutschButton = screen.getByTestId('switch-to-de');
      deutschButton.focus();

      expect(document.activeElement).toBe(deutschButton);
    });
  });
});
