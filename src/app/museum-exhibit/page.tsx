'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import AttractMode from './components/AttractMode';
import SessionManager from './components/SessionManager';
import ExhibitTimeline from './components/ExhibitTimeline';
import LanguageSelector from './components/LanguageSelector';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useTranslation } from '../../i18n/useTranslation';

const TouchMap = dynamic(() => import('./components/TouchMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-white text-2xl font-mono animate-pulse">Loading exhibit...</div>
    </div>
  )
});

function MuseumExhibitContent() {
  const { t, language, toggleLanguage } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(1933, 0, 1));
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [touchPoints, setTouchPoints] = useState<Array<{x: number, y: number, id: number}>>([]);
  const touchIdRef = useRef(0);
  
  const minDate = new Date(1920, 0, 1);
  const maxDate = new Date(1945, 11, 31);

  // Handle any touch to activate
  const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isActive) {
      setIsActive(true);
      setShowTimeline(true);
    }
    
    // Create ripple effect
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0]?.clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = 'touches' in e ? e.touches[0]?.clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    
    if (x !== undefined && y !== undefined) {
      const id = touchIdRef.current++;
      setTouchPoints(prev => [...prev, { x, y, id }]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setTouchPoints(prev => prev.filter(p => p.id !== id));
      }, 1000);
    }
  }, [isActive]);

  // Handle session timeout
  const handleSessionEnd = useCallback(() => {
    setIsActive(false);
    setSelectedBusiness(null);
    setShowTimeline(false);
    setCurrentDate(new Date(1933, 0, 1));
  }, []);

  // Handle language change
  const handleLanguageChange = useCallback((lang: string) => {
    if (lang === 'en' && language !== 'en') {
      toggleLanguage();
    } else if (lang === 'de' && language !== 'de') {
      toggleLanguage();
    }
  }, [language, toggleLanguage]);

  // Keyboard prevention for kiosk mode
  useEffect(() => {
    const preventKeyboard = (e: KeyboardEvent) => {
      e.preventDefault();
      return false;
    };
    
    document.addEventListener('keydown', preventKeyboard);
    return () => document.removeEventListener('keydown', preventKeyboard);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden cursor-none select-none"
      onTouchStart={handleTouch}
      onMouseDown={handleTouch}
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Touch ripple effects */}
      {touchPoints.map(point => (
        <div
          key={point.id}
          className="absolute pointer-events-none"
          style={{
            left: point.x,
            top: point.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="touch-ripple" />
        </div>
      ))}

      {/* Attract Mode - Shows when inactive */}
      <AttractMode isVisible={!isActive} />

      {/* Main Exhibit Interface */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 museum-grid-pattern" />
        </div>

        {/* Main Content Area */}
        <div className="relative h-full flex flex-col">
          
          {/* Header */}
          <div className="relative z-20 bg-black bg-opacity-80 backdrop-blur-lg border-b border-gray-800">
            <div className="px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <h1 className="text-3xl font-light text-white tracking-wide">
                  {t('hero.title')}
                </h1>
                <div className="text-xl text-gray-400">
                  {t('hero.period')}
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <LanguageSelector 
                  currentLanguage={language} 
                  onLanguageChange={handleLanguageChange}
                />
                <button
                  onClick={handleSessionEnd}
                  className="px-6 py-3 bg-red-900 bg-opacity-50 text-white text-lg border border-red-700 hover:bg-opacity-70 transition-all duration-300"
                  style={{ minWidth: '150px', minHeight: '60px' }}
                >
                  {language === 'en' ? 'Start Over' : 'Neustart'}
                </button>
              </div>
            </div>
          </div>

          {/* Map and Timeline Container */}
          <div className="flex-1 relative">
            
            {/* Touch-optimized Map */}
            <TouchMap 
              currentDate={currentDate}
              onBusinessSelect={setSelectedBusiness}
              selectedBusiness={selectedBusiness}
              isActive={isActive}
            />

            {/* Timeline Overlay */}
            <div className={`absolute bottom-0 left-0 right-0 transition-transform duration-700 ${showTimeline ? 'translate-y-0' : 'translate-y-full'}`}>
              <ExhibitTimeline
                minDate={minDate}
                maxDate={maxDate}
                currentDate={currentDate}
                onChange={setCurrentDate}
                isPlaying={isActive}
              />
            </div>

            {/* Statistics Overlay */}
            <div className="absolute top-8 left-8 bg-black bg-opacity-80 backdrop-blur-lg p-6 border border-gray-800">
              <div className="space-y-4">
                <div className="text-gray-400 text-sm uppercase tracking-wider">
                  {language === 'en' ? 'Active Businesses' : 'Aktive Geschäfte'}
                </div>
                <div className="text-5xl font-light text-white museum-counter">
                  {Math.max(0, Math.floor(2847 * (1 - (currentDate.getFullYear() - 1920) / 25)))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="absolute top-8 right-8 bg-black bg-opacity-80 backdrop-blur-lg p-6 border border-gray-800">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white">{language === 'en' ? 'Active' : 'Aktiv'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full" />
                  <span className="text-white">{language === 'en' ? 'Declining' : 'Gefährdet'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full" />
                  <span className="text-white">{language === 'en' ? 'Closed' : 'Geschlossen'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Manager */}
      <SessionManager 
        isActive={isActive}
        onSessionEnd={handleSessionEnd}
        timeoutMinutes={3}
      />

      {/* Museum-specific styles */}
      <style jsx>{`
        .touch-ripple {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
          animation: ripple 1s ease-out forwards;
        }

        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        .museum-grid-pattern {
          background-image: 
            linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .02) 25%, rgba(255, 255, 255, .02) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .02) 75%, rgba(255, 255, 255, .02) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .02) 25%, rgba(255, 255, 255, .02) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .02) 75%, rgba(255, 255, 255, .02) 76%, transparent 77%, transparent);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .museum-counter {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.05em;
        }

        @media (max-height: 800px) {
          .text-5xl { font-size: 2.5rem; }
          .text-3xl { font-size: 1.875rem; }
        }
      `}</style>
    </div>
  );
}

export default function MuseumExhibitPage() {
  return (
    <TranslationProvider>
      <MuseumExhibitContent />
    </TranslationProvider>
  );
}