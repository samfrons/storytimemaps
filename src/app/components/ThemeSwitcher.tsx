'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) return null;

  const themeDisplayNames: Record<string, string> = {
    moody: 'Moody',
    cool: 'Cool',
    warm: 'Warm',
    hot: 'Hot',
    cold: 'Cold',
    bauhaus: 'Bauhaus',
    'art-nouveau': 'Art Nouveau'
  };

  const currentThemeName = themeDisplayNames[theme || 'moody'] || 'Moody';

  return (
    <div ref={dropdownRef} className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#6b6275]/50 hover:bg-[#6b6275]/70 border border-[#6b6275] text-[#f5cdb4] text-xs font-mono transition-all uppercase tracking-wide"
        aria-label="Switch theme"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z" />
        </svg>
        <span>{currentThemeName}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[#6b6275]/95 border border-[#6b6275] backdrop-blur-sm shadow-lg min-w-full">
          {themes?.filter(t => t !== 'system').map((themeName) => (
            <button
              key={themeName}
              onClick={() => {
                setTheme(themeName);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-xs font-mono transition-colors hover:bg-[#6b6275]/70 uppercase tracking-wide ${
                theme === themeName 
                  ? 'bg-[#97d8c0]/20 text-[#97d8c0] border-l-2 border-l-[#97d8c0]' 
                  : 'text-[#f5cdb4] hover:text-[#97d8c0]'
              }`}
            >
              {themeDisplayNames[themeName] || themeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;