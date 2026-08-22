'use client'

import React, { useState, useCallback, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import AttractMode from './components/AttractMode'
import SessionManager from './components/SessionManager'
import ExhibitTimeline from './components/ExhibitTimeline'
// TranslationProvider now in root layout
import { useTranslation } from '../../i18n/useTranslation'
import { OverlayCopyright } from '../components/SiteFooter'

const TouchMap = dynamic(() => import('./components/TouchMapSimple'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      <div className="text-white text-2xl font-mono animate-pulse">LOADING...</div>
    </div>
  ),
})

function MuseumExhibitContent() {
  const { language, toggleLanguage } = useTranslation() // Removed unused 't'
  const [isActive, setIsActive] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date(1933, 0, 1))
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [showTimeline, setShowTimeline] = useState(false)
  const [touchPoints, setTouchPoints] = useState<Array<{ x: number; y: number; id: number }>>([])
  const [businessStats, setBusinessStats] = useState({
    total: 10021,
    active: 0,
    declining: 0,
    takenOver: 0,
    liquidated: 0,
  })
  const touchIdRef = useRef(0)

  const minDate = new Date(1920, 0, 1)
  const maxDate = new Date(1945, 11, 31)

  // Handle any touch to activate
  const handleTouch = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isActive) {
        setIsActive(true)
        setShowTimeline(true)
      }

      // Create ripple effect
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x =
        'touches' in e
          ? e.touches[0]?.clientX - rect.left
          : (e as React.MouseEvent).clientX - rect.left
      const y =
        'touches' in e
          ? e.touches[0]?.clientY - rect.top
          : (e as React.MouseEvent).clientY - rect.top

      if (x !== undefined && y !== undefined) {
        const id = touchIdRef.current++
        setTouchPoints((prev) => [...prev, { x, y, id }])

        // Remove ripple after animation
        setTimeout(() => {
          setTouchPoints((prev) => prev.filter((p) => p.id !== id))
        }, 1000)
      }
    },
    [isActive]
  )

  // Handle session timeout
  const handleSessionEnd = useCallback(() => {
    setIsActive(false)
    setSelectedBusiness(null)
    setShowTimeline(false)
    setCurrentDate(new Date(1933, 0, 1))
  }, [])

  // Handle language change
  const handleLanguageChange = useCallback(
    (lang: string) => {
      if (lang === 'en' && language !== 'en') {
        toggleLanguage()
      } else if (lang === 'de' && language !== 'de') {
        toggleLanguage()
      }
    },
    [language, toggleLanguage]
  )

  return (
    <div
      className="fixed inset-0 overflow-hidden cursor-none select-none"
      onTouchStart={handleTouch}
      onMouseDown={handleTouch}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Touch ripple effects */}
      {touchPoints.map((point) => (
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
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
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
            <div
              className="p-6"
              style={{ backgroundColor: '#FFFFFF', border: '6px solid #000000' }}
            >
              <div className="flex items-center gap-6">
                <div>
                  <h1
                    className="text-4xl font-black uppercase tracking-tight leading-none"
                    style={{ color: '#000000' }}
                  >
                    JEWISH
                  </h1>
                  <h1
                    className="text-4xl font-black uppercase tracking-tight leading-none"
                    style={{ color: '#000000' }}
                  >
                    BUSINESSES IN
                  </h1>
                  <h1
                    className="text-4xl font-black uppercase tracking-tight leading-none"
                    style={{ color: '#000000' }}
                  >
                    BERLIN
                  </h1>
                </div>
                <div
                  className="px-4 py-2"
                  style={{
                    backgroundColor: '#FFD93D',
                    border: '4px solid #000000',
                    color: '#000000',
                  }}
                >
                  <div className="text-3xl font-black leading-none">1900</div>
                  <div className="text-3xl font-black leading-none">1945</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Right - Controls */}
          <div className="absolute top-8 right-8 z-20 pointer-events-auto">
            <div className="flex items-start gap-4">
              {/* Language buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className="px-6 py-4 font-black uppercase text-lg transition-all"
                  style={{
                    backgroundColor: language === 'en' ? '#00D9D9' : '#FFFFFF',
                    color: '#000000',
                    border: '6px solid #000000',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                >
                  ENGLISH
                </button>
                <button
                  onClick={() => handleLanguageChange('de')}
                  className="px-6 py-4 font-black uppercase text-lg transition-all"
                  style={{
                    backgroundColor: language === 'de' ? '#00D9D9' : '#FFFFFF',
                    color: '#000000',
                    border: '6px solid #000000',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                >
                  DEUTSCH
                </button>
              </div>

              <button
                onClick={handleSessionEnd}
                className="px-8 py-4 font-black uppercase text-lg transition-all"
                style={{
                  backgroundColor: '#FF6B35',
                  color: '#000000',
                  border: '6px solid #000000',
                  outline: 'none',
                  boxShadow: 'none',
                }}
              >
                START OVER
              </button>
            </div>
          </div>

          {/* Bottom Row - Statistics, Timeline, Status Key */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto flex items-end gap-4 p-6">
            {/* Statistics Panel - Left */}
            <div
              className="flex-shrink-0 p-6"
              style={{
                backgroundColor: '#FFFFFF',
                border: '6px solid #000000',
                width: '320px',
              }}
            >
              <div
                className="text-xl font-black uppercase tracking-wider mb-4"
                style={{ color: '#000000' }}
              >
                STATISTICS
              </div>
              <div className="space-y-3">
                <div
                  className="p-3"
                  style={{ backgroundColor: '#00D9D9', border: '4px solid #000000' }}
                >
                  <div className="text-3xl font-black" style={{ color: '#000000' }}>
                    {businessStats.active.toLocaleString()}
                  </div>
                  <div className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    ACTIVE
                  </div>
                </div>
                <div
                  className="p-3"
                  style={{ backgroundColor: '#FFD93D', border: '4px solid #000000' }}
                >
                  <div className="text-3xl font-black" style={{ color: '#000000' }}>
                    {businessStats.declining.toLocaleString()}
                  </div>
                  <div className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    DECLINING
                  </div>
                </div>
                <div
                  className="p-3"
                  style={{ backgroundColor: '#FF6B35', border: '4px solid #000000' }}
                >
                  <div className="text-3xl font-black" style={{ color: '#000000' }}>
                    {businessStats.takenOver.toLocaleString()}
                  </div>
                  <div className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    TAKEN
                  </div>
                </div>
                <div
                  className="p-3"
                  style={{ backgroundColor: '#C589E8', border: '4px solid #000000' }}
                >
                  <div className="text-3xl font-black" style={{ color: '#000000' }}>
                    {businessStats.liquidated.toLocaleString()}
                  </div>
                  <div className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    CLOSED
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4" style={{ borderTop: '4px solid #000000' }}>
                <div
                  className="text-center p-3"
                  style={{ backgroundColor: '#F0F0F0', border: '4px solid #000000' }}
                >
                  <div className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    TOTAL
                  </div>
                  <div className="text-4xl font-black" style={{ color: '#000000' }}>
                    {businessStats.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline - Center */}
            <div
              className={`flex-1 transition-all duration-700 ${showTimeline ? 'opacity-100' : 'opacity-0'}`}
            >
              <ExhibitTimeline
                minDate={minDate}
                maxDate={maxDate}
                currentDate={currentDate}
                onChange={setCurrentDate}
                isPlaying={isActive}
              />
            </div>

            {/* Status Key - Right */}
            <div
              className="flex-shrink-0 p-6"
              style={{
                backgroundColor: '#FFFFFF',
                border: '6px solid #000000',
                width: '240px',
              }}
            >
              <div
                className="text-xl font-black uppercase tracking-wider mb-4"
                style={{ color: '#000000' }}
              >
                STATUS KEY
              </div>
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 p-2"
                  style={{ backgroundColor: '#00D9D9', border: '4px solid #000000' }}
                >
                  <div className="w-6 h-6" style={{ backgroundColor: '#000000' }} />
                  <span className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    ACTIVE
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 p-2"
                  style={{ backgroundColor: '#FFD93D', border: '4px solid #000000' }}
                >
                  <div className="w-6 h-6" style={{ backgroundColor: '#000000' }} />
                  <span className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    PRESSURE
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 p-2"
                  style={{ backgroundColor: '#FF6B35', border: '4px solid #000000' }}
                >
                  <div className="w-6 h-6" style={{ backgroundColor: '#000000' }} />
                  <span className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    TAKEN
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 p-2"
                  style={{ backgroundColor: '#C589E8', border: '4px solid #000000' }}
                >
                  <div className="w-6 h-6" style={{ backgroundColor: '#000000' }} />
                  <span className="text-sm font-black uppercase" style={{ color: '#000000' }}>
                    CLOSED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The kiosk runs on its own hard black-on-white palette rather than the
          site themes, so the notice is given those literal values. */}
      <OverlayCopyright
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        textStyle={{ color: '#3a3a3a' }}
      />

      {/* Session Manager */}
      <SessionManager isActive={isActive} onSessionEnd={handleSessionEnd} timeoutMinutes={3} />
    </div>
  )
}

export default function MuseumExhibitPage() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <div
            className="text-4xl font-black uppercase tracking-tight"
            style={{ color: '#000000' }}
          >
            LOADING...
          </div>
        </div>
      }
    >
      <MuseumExhibitContent />
    </Suspense>
  )
}
