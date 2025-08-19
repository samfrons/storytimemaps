'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import AttractMode from './components/AttractMode';
import SessionManager from './components/SessionManager';
import ExhibitTimeline from './components/ExhibitTimeline';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useTranslation } from '../../i18n/useTranslation';

const TouchMap = dynamic(() => import('./components/TouchMapSimple'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="text-white text-2xl font-mono animate-pulse">LOADING...</div>
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
        
        {/* Map Layer - Full screen */}
        <div className="absolute inset-0">
          <TouchMap 
            currentDate={currentDate}
            onBusinessSelect={setSelectedBusiness}
            selectedBusiness={selectedBusiness}
            isActive={isActive}
            onStatsUpdate={setBusinessStats}
          />
        </div>

        {/* Main content overlay */}
        <div className="relative h-full flex flex-col pointer-events-none">
          
          {/* Brutalist Header - Transparent background */}
          <div className="relative z-20 pointer-events-auto" 
               style={{ 
                 backgroundColor: 'transparent'
               }}>
            <div className="px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-none" style={{ color: '#ffffff' }}>
                    JEWISH
                  </h1>
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-none" style={{ color: '#ffffff' }}>
                    BUSINESSES IN
                  </h1>
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-none" style={{ color: '#ffffff' }}>
                    BERLIN
                  </h1>
                </div>
                <div className="text-2xl font-black" style={{ color: '#ffcc00' }}>
                  1900-<br/>1945
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Language buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className="px-6 py-3 font-black uppercase text-lg transition-all"
                    style={{ 
                      backgroundColor: language === 'en' ? '#ffcc00' : 'transparent',
                      color: language === 'en' ? '#000' : '#fff',
                      border: `3px solid ${language === 'en' ? '#ffcc00' : '#fff'}`,
                    }}
                  >
                    🇬🇧 ENGLISH
                  </button>
                  <button
                    onClick={() => handleLanguageChange('de')}
                    className="px-6 py-3 font-black uppercase text-lg transition-all"
                    style={{ 
                      backgroundColor: language === 'de' ? '#ffcc00' : 'transparent',
                      color: language === 'de' ? '#000' : '#fff',
                      border: `3px solid ${language === 'de' ? '#ffcc00' : '#fff'}`,
                    }}
                  >
                    🇩🇪 DEUTSCH
                  </button>
                </div>
                
                <button
                  onClick={handleSessionEnd}
                  className="px-8 py-4 text-white font-black uppercase text-lg transition-all"
                  style={{ 
                    backgroundColor: '#ff3300',
                    border: '3px solid #ffffff',
                    boxShadow: '5px 5px 0 rgba(0,0,0,0.5)'
                  }}
                >
                  START OVER
                </button>
              </div>
            </div>
          </div>

          {/* Spacer to push content */}
          <div className="flex-1" />

          {/* Bottom control area - Transparent without blur */}
          <div className="relative z-20 pointer-events-auto" 
               style={{ 
                 backgroundColor: 'transparent'
               }}>
            
            {/* Stats and Legend Row */}
            <div className="px-8 py-6 flex justify-between items-start">
              
              {/* Statistics Panel */}
              <div className="flex flex-col gap-2">
                <div className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: '#ffcc00' }}>
                  STATISTICS
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 px-4 py-2" style={{ backgroundColor: 'rgba(255, 102, 0, 0.2)', border: '2px solid rgba(255, 102, 0, 0.4)' }}>
                    <div className="text-4xl font-black" style={{ color: '#00ff00' }}>
                      {businessStats.active.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      ACTIVE
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2" style={{ backgroundColor: 'rgba(255, 102, 0, 0.2)', border: '2px solid rgba(255, 102, 0, 0.4)' }}>
                    <div className="text-4xl font-black" style={{ color: '#ffcc00' }}>
                      {businessStats.declining.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      DECLINING
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2" style={{ backgroundColor: 'rgba(255, 102, 0, 0.2)', border: '2px solid rgba(255, 102, 0, 0.4)' }}>
                    <div className="text-4xl font-black" style={{ color: '#ff6600' }}>
                      {businessStats.takenOver.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      TAKEN
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2" style={{ backgroundColor: 'rgba(255, 102, 0, 0.2)', border: '2px solid rgba(255, 102, 0, 0.4)' }}>
                    <div className="text-4xl font-black" style={{ color: '#ff3300' }}>
                      {businessStats.liquidated.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      LIQUIDATED
                    </div>
                  </div>
                </div>
                <div className="pt-3 mt-3 px-4 py-2" style={{ backgroundColor: 'rgba(255, 102, 0, 0.15)', border: '2px solid rgba(255, 102, 0, 0.3)' }}>
                  <div className="flex items-baseline gap-3">
                    <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      TOTAL DOCUMENTED
                    </div>
                    <div className="text-2xl font-black" style={{ color: '#ffffff' }}>
                      {businessStats.total.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Key */}
              <div className="flex flex-col gap-2">
                <div className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: '#ffcc00' }}>
                  STATUS KEY
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#00ff00' }} />
                    <span className="text-sm font-bold uppercase text-white">Active & Operating</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#ffcc00' }} />
                    <span className="text-sm font-bold uppercase text-white">Under Pressure</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#ff6600' }} />
                    <span className="text-sm font-bold uppercase text-white">Taken Over</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: '#ff3300' }} />
                    <span className="text-sm font-bold uppercase text-white">Liquidated</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 text-xs uppercase font-bold" style={{ borderTop: '2px solid #333', color: '#808080' }}>
                  Click clusters to zoom
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className={`transition-all duration-700 ${showTimeline ? 'opacity-100' : 'opacity-0'}`}>
              <ExhibitTimeline
                minDate={minDate}
                maxDate={maxDate}
                currentDate={currentDate}
                onChange={setCurrentDate}
                isPlaying={isActive}
              />
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

      {/* Brutalist styles */}
      <style jsx>{`
        .touch-ripple {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,51,0,0.8) 0%, transparent 70%);
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