'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const LanguageToggle: React.FC = () => {
  const { language, switchToLanguage } = useTranslation();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => switchToLanguage('en')}
        className={`px-3 py-1.5 font-mono text-sm transition-colors duration-200 border`}
        style={{
          backgroundColor: language === 'en' ? 'var(--primary)' : 'var(--muted)',
          color: language === 'en' ? 'var(--background)' : 'var(--foreground)',
          borderColor: language === 'en' ? 'var(--primary)' : 'var(--border)'
        }}
        onMouseEnter={(e) => {
          if (language !== 'en') {
            e.currentTarget.style.backgroundColor = 'var(--border)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (language !== 'en') {
            e.currentTarget.style.backgroundColor = 'var(--muted)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }
        }}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => switchToLanguage('de')}
        className={`px-3 py-1.5 font-mono text-sm transition-colors duration-200 border`}
        style={{
          backgroundColor: language === 'de' ? 'var(--primary)' : 'var(--muted)',
          color: language === 'de' ? 'var(--background)' : 'var(--foreground)',
          borderColor: language === 'de' ? 'var(--primary)' : 'var(--border)'
        }}
        onMouseEnter={(e) => {
          if (language !== 'de') {
            e.currentTarget.style.backgroundColor = 'var(--border)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (language !== 'de') {
            e.currentTarget.style.backgroundColor = 'var(--muted)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }
        }}
        aria-label="Switch to German"
      >
        DE
      </button>
      <button
        onClick={() => switchToLanguage('yi')}
        className={`px-3 py-1.5 font-mono text-sm transition-colors duration-200 border`}
        style={{
          backgroundColor: language === 'yi' ? 'var(--primary)' : 'var(--muted)',
          color: language === 'yi' ? 'var(--background)' : 'var(--foreground)',
          borderColor: language === 'yi' ? 'var(--primary)' : 'var(--border)'
        }}
        onMouseEnter={(e) => {
          if (language !== 'yi') {
            e.currentTarget.style.backgroundColor = 'var(--border)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (language !== 'yi') {
            e.currentTarget.style.backgroundColor = 'var(--muted)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }
        }}
        aria-label="Switch to Yiddish"
        title="ייִדיש (Yiddish)"
      >
        YI
      </button>
    </div>
  );
};

export default React.memo(LanguageToggle);