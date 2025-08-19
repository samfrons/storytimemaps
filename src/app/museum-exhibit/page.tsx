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
        backgroundColor: '#1a202c'
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

        {/* UI Overlays - pointer-events-none so map is interactive */}
        <div className="absolute inset-0 pointer-events-none">
          
          {/* Top Left - Header only */}
          <div className="absolute top-8 left-8 z-20 pointer-events-auto">
            <div className="p-4" style={{ backgroundColor: 'rgba(26, 32, 44, 0.95)', border: '2px solid #00d9bf' }}>
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-none" style={{ color: '#00d9bf' }}>
                    JEWISH
                  </h1>
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-none" style={{ color: '#00d9bf' }}>
                    BUSINESSES IN
                  </h1>
                  <h1 className="text-3xl font-black uppercase tracking-tight leading-none" style={{ color: '#00d9bf' }}>
                    BERLIN
                  </h1>
                </div>
                <div className="text-2xl font-black" style={{ color: '#ffb700' }}>
                  1900-<br/>1945
                </div>
              </div>
            </div>
          </div>

          {/* Top Right - Controls */}
          <div className="absolute top-8 right-8 z-20 pointer-events-auto">
            <div className="flex items-start gap-4">
              {/* Language buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className="px-5 py-2 font-black uppercase text-sm transition-all"
                  style={{ 
                    backgroundColor: language === 'en' ? '#00d9bf' : 'rgba(26, 32, 44, 0.95)',
                    color: language === 'en' ? '#1a202c' : '#00d9bf',
                    border: `2px solid #00d9bf`,
                  }}
                >
                  🇬🇧 ENGLISH
                </button>
                <button
                  onClick={() => handleLanguageChange('de')}
                  className="px-5 py-2 font-black uppercase text-sm transition-all"
                  style={{ 
                    backgroundColor: language === 'de' ? '#00d9bf' : 'rgba(26, 32, 44, 0.95)',
                    color: language === 'de' ? '#1a202c' : '#00d9bf',
                    border: `2px solid #00d9bf`,
                  }}
                >
                  🇩🇪 DEUTSCH
                </button>
              </div>
              
              <button
                onClick={handleSessionEnd}
                className="px-6 py-2 font-black uppercase text-sm transition-all"
                style={{ 
                  backgroundColor: '#ffb700',
                  color: '#1a202c',
                  border: '2px solid #ffb700'
                }}
              >
                START OVER
              </button>
            </div>
          </div>

          {/* Bottom Row - Statistics, Timeline, Status Key */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto flex items-end gap-4 p-6">
            
            {/* Statistics Panel - Left */}
            <div className="flex-shrink-0 p-4" 
                 style={{ 
                   backgroundColor: 'rgba(26, 32, 44, 0.95)',
                   border: '2px solid #00d9bf',
                   width: '280px'
                 }}>
              <div className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: '#00d9bf' }}>
                STATISTICS
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black" style={{ color: '#00d9bf' }}>
                    {businessStats.active.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    ACTIVE
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black" style={{ color: '#ffb700' }}>
                    {businessStats.declining.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    DECLINING
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black" style={{ color: '#ff8c00' }}>
                    {businessStats.takenOver.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    TAKEN
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black" style={{ color: '#718096' }}>
                    {businessStats.liquidated.toLocaleString()}
                  </div>
                  <div className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    CLOSED
                  </div>
                </div>
              </div>
              <div className="pt-2 mt-2" style={{ borderTop: '1px solid rgba(0, 217, 191, 0.3)' }}>
                <div className="flex items-baseline gap-2">
                  <div className="text-xs font-bold uppercase" style={{ color: 'rgba(0, 217, 191, 0.6)' }}>
                    TOTAL
                  </div>
                  <div className="text-xl font-black" style={{ color: '#00d9bf' }}>
                    {businessStats.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline - Center */}
            <div className={`flex-1 transition-all duration-700 ${showTimeline ? 'opacity-100' : 'opacity-0'}`}>
              <ExhibitTimeline
                minDate={minDate}
                maxDate={maxDate}
                currentDate={currentDate}
                onChange={setCurrentDate}
                isPlaying={isActive}
              />
            </div>

            {/* Status Key - Right */}
            <div className="flex-shrink-0 p-4" 
                 style={{ 
                   backgroundColor: 'rgba(26, 32, 44, 0.95)',
                   border: '2px solid #00d9bf',
                   width: '200px'
                 }}>
              <div className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: '#00d9bf' }}>
                STATUS KEY
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#00d9bf' }} />
                  <span className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#ffb700' }} />
                  <span className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Pressure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#ff8c00' }} />
                  <span className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Taken</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#718096' }} />
                  <span className="text-xs font-bold uppercase" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Closed</span>
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

      {/* Brutalist styles */}
      <style jsx>{`
        .touch-ripple {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,217,191,0.8) 0%, transparent 70%);
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