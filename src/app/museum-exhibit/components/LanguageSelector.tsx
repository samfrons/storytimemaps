'use client';

import React from 'react';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  currentLanguage, 
  onLanguageChange 
}) => {
  return (
    <div className="flex gap-4">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className={`flex items-center gap-3 px-6 py-4 transition-all duration-300 border ${
            currentLanguage === lang.code 
              ? 'bg-white text-black border-white' 
              : 'bg-white bg-opacity-10 text-white border-gray-600 hover:bg-opacity-20'
          }`}
          style={{ minWidth: '140px', minHeight: '60px' }}
        >
          <span className="text-3xl">{lang.flag}</span>
          <span className="text-lg font-medium">{lang.name}</span>
        </button>
      ))}
    </div>
  );
};

export default React.memo(LanguageSelector);