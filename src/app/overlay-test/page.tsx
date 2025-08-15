'use client';

import React, { useState, useEffect } from 'react';
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
  const { setTheme } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  useEffect(() => {
    setTheme('moody');
  }, [setTheme]);

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
          <div className="hidden md:flex md:w-16 md:h-full bg-black/80 backdrop-blur-sm flex-shrink-0 flex-col items-center py-6 gap-4 relative" style={{ zIndex: 10000 }}>
            {/* Home Button */}
            <button
              onClick={goHome}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 ${
                showIntro ? 'bg-white text-black' : 'bg-transparent text-white hover:bg-white/20'
              }`}
              aria-label="Home"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </button>

            {/* Info Button */}
            <button
              onClick={toggleInfo}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 ${
                showInfo ? 'bg-white text-black' : 'bg-transparent text-white hover:bg-white/20'
              }`}
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
        className="md:hidden fixed top-4 left-4 w-10 h-10 bg-black/80 backdrop-blur-sm flex items-center justify-center"
        style={{ zIndex: 10001 }}
        aria-label="Menu"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {showMobileMenu ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-16 left-4 bg-black/90 backdrop-blur-sm p-2 flex flex-col gap-2" style={{ zIndex: 10001 }}>
          <button
            onClick={() => {
              goHome();
              setShowMobileMenu(false);
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 ${
              showIntro ? 'bg-white text-black' : 'bg-transparent text-white hover:bg-white/20'
            }`}
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
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 ${
              showInfo ? 'bg-white text-black' : 'bg-transparent text-white hover:bg-white/20'
            }`}
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
        className={`fixed md:absolute top-0 left-0 md:left-16 right-0 bottom-0 bg-white/95 backdrop-blur-sm transition-transform duration-700 ease-in-out ${
          showIntro ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ zIndex: 9999 }}
      >
        {/* Close button */}
        <button
          onClick={handleLetsGo}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center bg-black/80 backdrop-blur-sm hover:bg-black transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="h-full flex items-center justify-center px-4 sm:px-6 md:px-8 py-16 md:py-0">
          <div className="max-w-4xl mx-auto text-center">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.05) 35px, rgba(0,0,0,.05) 70px)`,
              }} />
            </div>

            <div className="relative space-y-8">
              <div>
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-gray-900 mb-4 font-['Space_Mono'] font-mono">
                  Jewish Businesses
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-600 font-light font-['Space_Mono'] font-mono">
                  Berlin 1900-1945
                </p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed font-['Space_Mono'] font-mono">
                  Explore the stories of over 8,000 Jewish-owned businesses that once 
                  formed the backbone of Berlin's commercial life.
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 font-['Space_Mono'] font-mono">
                  Navigate through time to witness their rise, struggles, and the tragic 
                  impact of Nazi persecution.
                </p>
              </div>

              <div className="pt-8">
                <button
                  onClick={handleLetsGo}
                  className="group inline-flex items-center gap-3 px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 bg-black text-white text-base sm:text-lg md:text-xl font-medium hover:bg-gray-900 transition-all duration-200 font-['Space_Mono'] font-mono"
                >
                  <span>Let's Explore</span>
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              <div className="pt-12 text-sm text-gray-500 font-mono">
                <p>Data: Dr. Christoph Kreutzmüller | Visualization: StoryTimeMaps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel - Slides from the right */}
      <div 
        className={`fixed md:absolute right-0 top-0 bottom-0 h-full w-full md:w-1/2 lg:w-2/5 bg-white/95 backdrop-blur-sm shadow-2xl transition-transform duration-500 ease-in-out ${
          showInfo ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 9998 }}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-8">
            {/* Close button */}
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center bg-black/80 backdrop-blur-sm hover:bg-black transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-8 mt-16 md:mt-0">
              <div>
                <h2 className="text-3xl font-light text-gray-900 mb-2 font-['Space_Mono'] font-mono">About This Project</h2>
                <div className="w-20 h-1 bg-black" />
              </div>

              <div className="space-y-6 text-gray-700 font-['Space_Mono'] font-mono">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Historical Context</h3>
                  <p className="leading-relaxed">
                    Between 1900 and 1945, Jewish entrepreneurs operated thousands of businesses 
                    in Berlin, from small shops to major department stores. This map documents 
                    their locations, types, and fates during the Nazi era.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">The Data</h3>
                  <p className="leading-relaxed">
                    Our database contains over 8,000 verified business records, compiled from 
                    historical directories, registration documents, and survivor testimonies. 
                    Each entry represents not just a business, but a family's livelihood and 
                    contribution to Berlin's economy.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Timeline Navigation</h3>
                  <p className="leading-relaxed">
                    Use the timeline controls to see how the business landscape changed over 
                    45 years. Watch businesses flourish in the 1920s, then witness the 
                    devastating impact of Nazi policies from 1933 onwards.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Color Coding</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4 bg-[#97d8c0]" />
                      <span>Active businesses</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4 bg-[#ffcb51]" />
                      <span>Businesses under pressure</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4 bg-[#ee5760]" />
                      <span>Closed/Liquidated businesses</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Research Team</h3>
                  <p className="leading-relaxed">
                    <strong>Dr. Christoph Kreutzmüller</strong><br />
                    Historical Research & Data Compilation<br />
                    <span className="text-sm text-gray-600">Humboldt University Berlin</span>
                  </p>
                  <p className="leading-relaxed mt-3">
                    <strong>StoryTimeMaps</strong><br />
                    Interactive Visualization & Web Development<br />
                    <span className="text-sm text-gray-600">Making history accessible through technology</span>
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    For academic citations, please reference: Kreutzmüller, C. (2024). 
                    "Jewish Businesses in Berlin 1900-1945: A Digital Archive"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}