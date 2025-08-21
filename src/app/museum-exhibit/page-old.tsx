'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import AttractMode from './components/AttractMode';
import SessionManager from './components/SessionManager';
import ExhibitTimeline from './components/ExhibitTimeline';
import LanguageSelector from './components/LanguageSelector';
// TranslationProvider now in root layout
import { useTranslation } from '../../i18n/useTranslation';
// import './styles/brutalist.css';

const TouchMap = dynamic(() => import('./components/TouchMapSimple'), { 
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
  const [businessStats, setBusinessStats] = useState({
    total: 10021,
    active: 0,
    declining: 0,
    takenOver: 0,
    liquidated: 0
  });
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
      className="fixed inset-0 overflow-hidden cursor-none select-none"
      onTouchStart={handleTouch}
      onMouseDown={handleTouch}
      style={{ 
        touchAction: 'none', 
        userSelect: 'none', 
        WebkitUserSelect: 'none',
        backgroundColor: '#0a0a0a'
      }}
    >
      {/* Brutalist noise overlay */}
      {/* <div className="brutalist-noise" /> */}
      
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
        
        {/* Brutalist background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        
        {/* Geometric grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 museum-grid-pattern" />
        </div>

        {/* Main Content Area */}
        <div className="relative h-full flex flex-col">
          
          {/* Brutalist Header */}
          <div className="relative z-20 brutalist-card" style={{ backgroundColor: '#1a1a1a', borderBottom: '5px solid #ff0000' }}>
            <div className="px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <h1 className="text-4xl font-black uppercase text-white">
                  {t('hero.title')}
                </h1>
                <div className="text-xl font-mono" style={{ color: '#ffff00' }}>
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
                  className="px-6 py-3 text-white font-bold uppercase transition-all duration-100"
                  style={{ 
                    minWidth: '150px', 
                    minHeight: '60px',
                    backgroundColor: '#ff0000',
                    border: '3px solid #ffffff'
                  }}
                >
                  {language === 'en' ? 'START OVER' : 'NEUSTART'}
                </button>
              </div>
            </div>
          </div>

          {/* Map and Timeline Container */}
          <div className="flex-1 relative">
            
            {/* Touch-optimized Map with 10,021 real businesses */}
            <TouchMap 
              currentDate={currentDate}
              onBusinessSelect={setSelectedBusiness}
              selectedBusiness={selectedBusiness}
              isActive={isActive}
              onStatsUpdate={setBusinessStats}
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

            {/* Brutalist Statistics Panel */}
            <div className="absolute top-8 left-8 brutalist-card p-6" style={{ backgroundColor: '#1a1a1a', border: '3px solid #fff' }}>
              <div className="space-y-4">
                <div className="text-sm font-mono uppercase mb-2" style={{ color: '#ffff00', letterSpacing: '0.2em' }}>
                  {language === 'en' ? 'STATISTICS' : 'STATISTIK'}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2 border" style={{ backgroundColor: '#0a0a0a', borderColor: '#333' }}>
                    <div className="text-3xl font-bold" style={{ color: '#00ff00' }}>
                      {businessStats.active.toLocaleString()}
                    </div>
                    <div className="text-xs font-mono uppercase" style={{ color: '#808080' }}>
                      {language === 'en' ? 'ACTIVE' : 'AKTIV'}
                    </div>
                  </div>
                  <div className="p-2 border" style={{ backgroundColor: '#0a0a0a', borderColor: '#333' }}>
                    <div className="text-3xl font-bold" style={{ color: '#ffff00' }}>
                      {businessStats.declining.toLocaleString()}
                    </div>
                    <div className="text-xs font-mono uppercase" style={{ color: '#808080' }}>
                      {language === 'en' ? 'DECLINING' : 'GEFÄHRDET'}
                    </div>
                  </div>
                  <div className="p-2 border" style={{ backgroundColor: '#0a0a0a', borderColor: '#333' }}>
                    <div className="text-3xl font-bold" style={{ color: '#ff6600' }}>
                      {businessStats.takenOver.toLocaleString()}
                    </div>
                    <div className="text-xs font-mono uppercase" style={{ color: '#808080' }}>
                      {language === 'en' ? 'TAKEN' : 'ÜBERNOMMEN'}
                    </div>
                  </div>
                  <div className="p-2 border" style={{ backgroundColor: '#0a0a0a', borderColor: '#333' }}>
                    <div className="text-3xl font-bold" style={{ color: '#ff0000' }}>
                      {businessStats.liquidated.toLocaleString()}
                    </div>
                    <div className="text-xs font-mono uppercase" style={{ color: '#808080' }}>
                      {language === 'en' ? 'LIQUIDATED' : 'LIQUIDIERT'}
                    </div>
                  </div>
                </div>
                <div className="pt-2" style={{ borderTop: '3px solid #fff' }}>
                  <div className="text-sm font-mono" style={{ color: '#808080' }}>
                    {language === 'en' ? 'TOTAL DOCUMENTED' : 'GESAMT DOKUMENTIERT'}
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                    {businessStats.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Brutalist Legend */}
            <div className="absolute top-8 right-8 brutalist-card p-6" style={{ backgroundColor: '#1a1a1a', border: '3px solid #fff' }}>
              <div className="space-y-3">
                <div className="brutalist-mono text-sm uppercase mb-3" style={{ color: '#ffff00', letterSpacing: '0.2em' }}>
                  {language === 'en' ? 'STATUS KEY' : 'STATUS SCHLÜSSEL'}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white text-sm">{language === 'en' ? 'Active & Operating' : 'Aktiv & Betriebsbereit'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full" />
                  <span className="text-white text-sm">{language === 'en' ? 'Under Pressure' : 'Unter Druck'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full" />
                  <span className="text-white text-sm">{language === 'en' ? 'Taken Over' : 'Übernommen'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full" />
                  <span className="text-white text-sm">{language === 'en' ? 'Liquidated' : 'Liquidiert'}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
                  {language === 'en' ? 'Click clusters to zoom' : 'Cluster anklicken zum Zoomen'}
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
  return <MuseumExhibitContent />;
}