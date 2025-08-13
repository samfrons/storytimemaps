'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useTranslation();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => language !== 'en' && toggleLanguage()}
        className={`px-3 py-1.5 font-mono text-sm transition-colors duration-200 border ${
          language === 'en' 
            ? 'bg-[#97d8c0] text-[#2a2a2a] border-[#97d8c0]' 
            : 'bg-[#6b6275] text-[#f5cdb4] border-[#8b7d8e] hover:bg-[#7a7184] hover:border-[#97d8c0]'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => language !== 'de' && toggleLanguage()}
        className={`px-3 py-1.5 font-mono text-sm transition-colors duration-200 border ${
          language === 'de' 
            ? 'bg-[#97d8c0] text-[#2a2a2a] border-[#97d8c0]' 
            : 'bg-[#6b6275] text-[#f5cdb4] border-[#8b7d8e] hover:bg-[#7a7184] hover:border-[#97d8c0]'
        }`}
        aria-label="Switch to German"
      >
        DE
      </button>
    </div>
  );
};

export default React.memo(LanguageToggle);