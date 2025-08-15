'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useTranslation();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => language !== 'en' && toggleLanguage()}
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
        onClick={() => language !== 'de' && toggleLanguage()}
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
    </div>
  );
};

export default React.memo(LanguageToggle);