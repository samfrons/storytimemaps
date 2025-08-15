'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import StoryList from '../components/StoryList';
import { useStoryMapLogic, berlinCoordinates, defaultZoom } from '../../hooks/useStoryMapLogic';

const MapboxMap = dynamic(() => import('../components/MapboxMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#4a4a57] flex items-center justify-center">
      <div className="text-[#97d8c0] font-mono">Loading map...</div>
    </div>
  )
});

export default function OverlayTestPage() {
  const { theme, setTheme } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const {
    visibleStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers,
    setActiveStoryId
  } = useStoryMapLogic();


  const handleStoryClick = (storyId: string) => {
    setActiveStoryId(storyId);
    handleMarkerClick(storyId);
  };

  const handleLetsGo = () => {
    setShowIntro(false);
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
    if (showIntro) {
      setShowIntro(false);
    }
  };

  const goHome = () => {
    setShowIntro(true);
    setShowInfo(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#4a4a57]">
      {/* Main Layout with Sidebar, StoryList and Map */}
      <div className="flex flex-col md:flex-row h-screen">
          {/* Desktop Sidebar Navigation - Hidden on mobile */}
          <div className="hidden md:flex md:w-16 md:h-full flex-shrink-0 flex-col items-center py-6 gap-4 relative backdrop-blur-sm" 
               style={{ 
                 zIndex: 10000,
                 backgroundColor: 'var(--input-bg, rgba(var(--muted-rgb), 0.5))'
               }}>
            {/* Theme Button */}
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="w-10 h-10 flex items-center justify-center transition-all duration-200 border relative"
              style={{
                backgroundColor: showThemeMenu ? 'var(--primary)' : 'var(--input-bg, rgba(var(--muted-rgb), 0.5))',
                borderColor: 'var(--border)',
                color: showThemeMenu ? 'var(--background)' : 'var(--foreground)'
              }}
              aria-label="Switch theme"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z" />
              </svg>
            </button>
            
            {/* Theme Menu Dropdown */}
            {showThemeMenu && (
              <div className="absolute top-16 left-0 border backdrop-blur-sm shadow-lg p-2 min-w-[120px]" 
                   style={{ 
                     zIndex: 10001,
                     backgroundColor: 'var(--dropdown-bg, var(--input-bg, rgba(var(--muted-rgb), 0.9)))',
                     borderColor: 'var(--border)'
                   }}>
                {['moody', 'bauhaus', 'cool', 'warm', 'hot', 'cold', 'art-nouveau'].map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => {
                      setTheme(themeName);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-mono transition-colors capitalize hover:opacity-80`}
                    style={{
                      backgroundColor: theme === themeName ? 'var(--primary)' : 'transparent',
                      color: theme === themeName ? 'var(--background)' : 'var(--foreground)'
                    }}
                  >
                    {themeName === 'art-nouveau' ? 'Art Nouveau' : themeName}
                  </button>
                ))}
              </div>
            )}
            
            {/* Home Button */}
            <button
              onClick={goHome}
              className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hover:opacity-80"
              style={{
                backgroundColor: showIntro ? 'var(--primary)' : 'var(--input-bg, rgba(var(--muted-rgb), 0.5))',
                borderColor: 'var(--border)',
                color: showIntro ? 'var(--background)' : 'var(--foreground)'
              }}
              aria-label="Home"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </button>

            {/* Info Button */}
            <button
              onClick={toggleInfo}
              className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hover:opacity-80"
              style={{
                backgroundColor: showInfo ? 'var(--primary)' : 'var(--input-bg, rgba(var(--muted-rgb), 0.5))',
                borderColor: 'var(--border)',
                color: showInfo ? 'var(--background)' : 'var(--foreground)'
              }}
              aria-label="Information"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>
        
        {/* StoryList Panel - Visible on both mobile and desktop */}
        <div className="w-full md:w-1/3 h-1/2 md:h-screen order-2 md:order-1 flex-shrink-0">
          <StoryList
            visibleStories={visibleStories}
            activeStoryId={activeStoryId}
            minDate={minDate}
            maxDate={maxDate}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            onStoryClick={handleStoryClick}
          />
        </div>
        
        {/* Map Layer - Remaining space */}
        <div className="w-full md:flex-1 h-1/2 md:h-screen order-1 md:order-2 relative">
          <MapboxMap
            center={berlinCoordinates}
            zoom={defaultZoom}
            markers={testMarkers}
            onMarkerClick={handleStoryClick}
            activeMarkerId={activeStoryId}
            currentDate={currentDate}
            enrichedStories={visibleStories}
          />
        </div>
      </div>

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden fixed top-4 left-4 w-10 h-10 flex items-center justify-center border backdrop-blur-sm"
        style={{ 
          zIndex: 10001,
          backgroundColor: 'var(--input-bg, rgba(var(--muted-rgb), 0.5))',
          borderColor: 'var(--border)',
          color: 'var(--foreground)'
        }}
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {showMobileMenu ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-16 left-4 border backdrop-blur-sm shadow-lg p-2 flex flex-col gap-2" 
             style={{ 
               zIndex: 10001,
               backgroundColor: 'var(--dropdown-bg, var(--input-bg, rgba(var(--muted-rgb), 0.9)))',
               borderColor: 'var(--border)'
             }}>
          <button
            onClick={() => {
              goHome();
              setShowMobileMenu(false);
            }}
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80"
            style={{
              backgroundColor: showIntro ? 'var(--primary)' : 'var(--input-bg, rgba(var(--muted-rgb), 0.5))',
              borderColor: 'var(--border)',
              color: showIntro ? 'var(--background)' : 'var(--foreground)'
            }}
            aria-label="Home"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>
          <button
            onClick={() => {
              toggleInfo();
              setShowMobileMenu(false);
            }}
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80"
            style={{
              backgroundColor: showInfo ? 'var(--primary)' : 'var(--input-bg, rgba(var(--muted-rgb), 0.5))',
              borderColor: 'var(--border)',
              color: showInfo ? 'var(--background)' : 'var(--foreground)'
            }}
            aria-label="Information"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Intro Overlay - Slides to the left, but leaves sidebar visible */}
      <div 
        className={`fixed md:absolute top-0 left-0 md:left-16 right-0 bottom-0 backdrop-blur-sm transition-transform duration-700 ease-in-out overflow-hidden ${
          showIntro ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          zIndex: 9999,
          backgroundColor: 'rgba(var(--background-rgb), 0.98)'
        }}
      >
        {/* Animated Map Background with Ken Burns Effect */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%]"
            style={{
              backgroundImage: `url('/berlin-map.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'kenBurns 30s ease-in-out infinite alternate',
              filter: 'contrast(1.2) brightness(0.9)'
            }}
          />
        </div>
        
        {/* Close button */}
        <button
          onClick={handleLetsGo}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center border transition-colors z-10 hover:opacity-80"
          style={{
            backgroundColor: 'var(--input-bg, rgba(var(--muted-rgb), 0.5))',
            borderColor: 'var(--border)',
            color: 'var(--foreground)'
          }}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 md:px-8 py-16 md:py-0">
          <div className="max-w-4xl mx-auto text-center relative z-10">

            <div className="relative space-y-8">
              <div>
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light mb-4 font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground)' }}>
                  Jewish Businesses
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  Berlin 1900-1945
                </p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-base sm:text-lg md:text-xl leading-relaxed font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground)' }}>
                  Explore the stories of over 8,000 Jewish-owned businesses that once 
                  formed the backbone of Berlin&apos;s commercial life.
                </p>
                <p className="text-sm sm:text-base md:text-lg font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  Navigate through time to witness their rise, struggles, and the tragic 
                  impact of Nazi persecution.
                </p>
              </div>

              <div className="pt-8">
                <button
                  onClick={handleLetsGo}
                  className="group inline-flex items-center gap-3 px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 text-base sm:text-lg md:text-xl font-medium transition-all duration-200 font-['Space_Mono'] font-mono border-2"
                  style={{
                    backgroundColor: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    color: 'var(--background)'
                  }}
                >
                  <span>Let&apos;s Explore</span>
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              <div className="pt-12 text-sm font-mono" style={{ color: 'var(--muted)' }}>
                <p>Data: Dr. Christoph Kreutzmüller | Visualization: StoryTimeMaps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel - Slides from the right */}
      <div 
        className={`fixed md:absolute right-0 top-0 bottom-0 h-full w-full md:w-1/2 lg:w-2/5 backdrop-blur-sm shadow-2xl transition-transform duration-500 ease-in-out overflow-hidden ${
          showInfo ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          zIndex: 9998,
          backgroundColor: 'rgba(var(--background-rgb), 0.98)'
        }}
      >
        {/* Animated Map Background with Ken Burns Effect */}
        <div className="absolute inset-0 opacity-15">
          <div 
            className="absolute w-[200%] h-[200%] -top-[50%] -right-[50%]"
            style={{
              backgroundImage: `url('/berlin-map.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'kenBurnsReverse 25s ease-in-out infinite alternate',
              filter: 'contrast(1.2) brightness(0.9)'
            }}
          />
        </div>
        
        <div className="relative h-full overflow-y-auto">
          <div className="p-8">
            {/* Close button */}
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center border transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--input-bg, rgba(var(--muted-rgb), 0.5))',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-8 pt-16 md:pt-0">
              <div>
                <h2 className="text-3xl font-light mb-2 font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground)' }}>About This Project</h2>
                <div className="w-20 h-1" style={{ backgroundColor: 'var(--primary)' }} />
              </div>

              <div className="space-y-6 font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground)' }}>
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>Historical Context</h3>
                  <p className="leading-relaxed">
                    Between 1900 and 1945, Jewish entrepreneurs operated thousands of businesses 
                    in Berlin, from small shops to major department stores. This map documents 
                    their locations, types, and fates during the Nazi era.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>The Data</h3>
                  <p className="leading-relaxed">
                    Our database contains over 8,000 verified business records, compiled from 
                    historical directories, registration documents, and survivor testimonies. 
                    Each entry represents not just a business, but a family&apos;s livelihood and 
                    contribution to Berlin&apos;s economy.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>Timeline Navigation</h3>
                  <p className="leading-relaxed">
                    Use the timeline controls to see how the business landscape changed over 
                    45 years. Watch businesses flourish in the 1920s, then witness the 
                    devastating impact of Nazi policies from 1933 onwards.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>Color Coding</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4" style={{ backgroundColor: 'var(--success)' }} />
                      <span>Active businesses</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4" style={{ backgroundColor: 'var(--warning)' }} />
                      <span>Businesses under pressure</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4" style={{ backgroundColor: 'var(--danger)' }} />
                      <span>Closed/Liquidated businesses</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>Research Team</h3>
                  <p className="leading-relaxed">
                    <strong>Dr. Christoph Kreutzmüller</strong><br />
                    Historical Research &amp; Data Compilation<br />
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Humboldt University Berlin</span>
                  </p>
                  <p className="leading-relaxed mt-3">
                    <strong>StoryTimeMaps</strong><br />
                    Interactive Visualization &amp; Web Development<br />
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Making history accessible through technology</span>
                  </p>
                </div>

                <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    For academic citations, please reference: Kreutzmüller, C. (2024). 
                    &quot;Jewish Businesses in Berlin 1900-1945: A Digital Archive&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Ken Burns Animation Styles */}
      <style jsx>{`
        @keyframes kenBurns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          25% {
            transform: scale(1.1) translate(-5%, -5%);
          }
          50% {
            transform: scale(1.2) translate(5%, -10%);
          }
          75% {
            transform: scale(1.15) translate(-10%, 5%);
          }
          100% {
            transform: scale(1.05) translate(0, 0);
          }
        }
        
        @keyframes kenBurnsReverse {
          0% {
            transform: scale(1.05) translate(0, 0);
          }
          25% {
            transform: scale(1.15) translate(10%, -5%);
          }
          50% {
            transform: scale(1.2) translate(-5%, 10%);
          }
          75% {
            transform: scale(1.1) translate(5%, 5%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }
      `}</style>
    </div>
  );
}