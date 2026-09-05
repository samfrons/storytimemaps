'use client'

import React from 'react'

interface LanguageSelectorProps {
  currentLanguage: string
  onLanguageChange: (language: string) => void
}

// German first: it is the site's default language.
const languages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="flex gap-4">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className="relative group"
          style={{
            minWidth: '140px',
            minHeight: '60px',
            backgroundColor: currentLanguage === lang.code ? '#ffff00' : '#2c2c2c',
            color: currentLanguage === lang.code ? '#000' : '#fff',
            border: currentLanguage === lang.code ? '3px solid #000' : '3px solid #fff',
            fontWeight: 900,
            letterSpacing: '0.1em',
            padding: '12px 24px',
            boxShadow: '5px 5px 0 rgba(0,0,0,0.5)',
            transition: 'all 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-2px, -2px)'
            e.currentTarget.style.boxShadow = '7px 7px 0 rgba(0,0,0,0.7)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate(0, 0)'
            e.currentTarget.style.boxShadow = '5px 5px 0 rgba(0,0,0,0.5)'
          }}
        >
          <span className="text-3xl">{lang.flag}</span>
          <span className="text-lg uppercase font-black">{lang.name}</span>
        </button>
      ))}
    </div>
  )
}

export default React.memo(LanguageSelector)
