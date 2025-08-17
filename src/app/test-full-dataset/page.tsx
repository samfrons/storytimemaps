'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import StoryList from '../components/StoryList';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useStoryMapLogicTest as useStoryMapLogic, berlinCoordinates, defaultZoom } from '../../hooks/useStoryMapLogicTest';
import { useIsMounted } from '../../hooks/useIsMounted';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useTranslation } from '../../i18n/useTranslation';

const MapboxMap = dynamic(() => import('../components/MapboxMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading map...</div>
    </div>
  )
});

function TestFullDatasetPageContent() {
  const { t, language, toggleLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Always show intro on root page unless there are URL params
  const hasUrlParams = searchParams.toString() !== '';
  const [showIntro, setShowIntro] = useState(!hasUrlParams);
  const [introExplicitlyClosed, setIntroExplicitlyClosed] = useState(false); // Track if user closed intro
  const [showInfo, setShowInfo] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  
  // Sync with URL parameters on mount and when they change
  useEffect(() => {
    if (!mounted) return;
    
    // Check for about parameter
    const aboutParam = searchParams.get('about');
    if (aboutParam === 'true') {
      setShowInfo(true);
      setShowIntro(false);
    }
    
    // Check for theme parameter
    const themeParam = searchParams.get('theme');
    if (themeParam && ['moody', 'bauhaus', 'cool', 'warm', 'hot', 'cold', 'art-nouveau', 'archival'].includes(themeParam)) {
      setTheme(themeParam);
    } else if (!themeParam) {
      // Default to archival theme for full dataset page
      setTheme('archival');
    }
    
    // Show intro only on root page without params AND if not explicitly closed
    const hasParams = searchParams.toString() !== '';
    if (hasParams) {
      setShowIntro(false);
    } else if (!introExplicitlyClosed) {
      // Only show intro if user hasn't explicitly closed it
      setShowIntro(true);
    }
  }, [searchParams, mounted, setTheme, introExplicitlyClosed]);
  const {
    enrichedStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers,
    setActiveStoryId,
    isLoading
  } = useStoryMapLogic();


  // Helper function to update URL parameters
  const updateURLParams = useCallback((updates: { about?: boolean; lang?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.about !== undefined) {
      if (updates.about) {
        params.set('about', 'true');
      } else {
        params.delete('about');
      }
    }
    
    if (updates.lang !== undefined) {
      if (updates.lang) {
        params.set('lang', updates.lang);
      } else {
        params.delete('lang');
      }
    }
    
    const queryString = params.toString();
    router.push(queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset', { scroll: false });
  }, [router, searchParams]);

  const handleStoryClick = (storyId: string) => {
    setActiveStoryId(storyId);
    handleMarkerClick(storyId);
  };

  const handleThemeSwitch = useCallback((newTheme: string) => {
    if (!mounted) return;
    setShowThemeMenu(false);
    // Just update theme without URL parameter
    requestAnimationFrame(() => {
      setTheme(newTheme);
    });
  }, [mounted, setTheme]);

  const handleLetsGo = useCallback(() => {
    setShowIntro(false);
    setIntroExplicitlyClosed(true); // Mark that user explicitly closed intro
    // No sessionStorage - intro will show again on next visit to root
  }, []);

  const toggleInfo = useCallback(() => {
    const newShowInfo = !showInfo;
    setShowInfo(newShowInfo);
    updateURLParams({ about: newShowInfo });
    
    if (showIntro) {
      setShowIntro(false);
      setIntroExplicitlyClosed(true); // Mark as explicitly closed
    }
  }, [showInfo, showIntro, updateURLParams]);

  const goHome = useCallback(() => {
    // Navigate to root URL preserving language
    const params = new URLSearchParams();
    if (language) {
      params.set('lang', language);
    }
    const queryString = params.toString();
    router.push(queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset', { scroll: false });
    setShowIntro(true);
    setIntroExplicitlyClosed(false); // Reset so intro shows when home is clicked
    setShowInfo(false);
  }, [router, language]);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* TEST BANNER */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 font-mono text-sm">
        🚧 TEST PAGE - Full Dataset (10,000+ businesses) - Production Data Safe 🚧
      </div>
      
      {/* Desktop Sidebar Navigation - Always render immediately */}
      <div className="hidden md:flex md:w-16 md:h-full flex-shrink-0 flex-col items-center py-6 gap-4 absolute left-0 top-0 backdrop-blur-sm hot-sidebar" 
           style={{ 
             zIndex: 10000,
             backgroundColor: 'var(--input-bg)',
             marginTop: '40px' // Account for test banner
           }}>
            {/* Theme Button */}
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border relative hot-button cursor-pointer hover:opacity-80 ${showThemeMenu ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: showThemeMenu ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: showThemeMenu ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer'
              }}
              aria-label="Switch theme"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z" />
              </svg>
            </button>
            
            {/* Theme Menu Dropdown */}
            {showThemeMenu && (
              <div className="absolute top-16 left-0 border backdrop-blur-sm shadow-lg p-2 min-w-[120px] hot-dropdown" 
                   style={{ 
                     zIndex: 10001,
                     backgroundColor: 'var(--dropdown-bg)',
                     borderColor: 'var(--border)'
                   }}>
                {['archival', 'moody', 'bauhaus', 'hot', 'cold', 'cool', 'warm', 'art-nouveau'].map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => handleThemeSwitch(themeName)}
                    className={`w-full px-3 py-2 text-left text-xs font-mono transition-all capitalize ${mounted && theme === themeName ? 'dropdown-active' : ''}`}
                    style={{
                      backgroundColor: mounted && theme === themeName ? 'var(--primary)' : 'transparent',
                      color: mounted && theme === themeName ? 'var(--background)' : 'var(--foreground)',
                      borderLeft: mounted && theme === themeName ? '2px solid var(--primary)' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!mounted || theme !== themeName) {
                        e.currentTarget.style.backgroundColor = 'var(--muted)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!mounted || theme !== themeName) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--foreground)';
                      }
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {themeName === 'art-nouveau' ? 'Art Nouveau' : 
                     themeName === 'archival' ? 'Archival' : 
                     themeName}
                  </button>
                ))}
              </div>
            )}
            
            {/* Home Button */}
            <button
              onClick={goHome}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${showIntro ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: showIntro ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: showIntro ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer'
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
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${showInfo ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: showInfo ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: showInfo ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer'
              }}
              aria-label="Information"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            {/* Language Toggle Buttons */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  if (language !== 'en') {
                    toggleLanguage();
                    updateURLParams({ lang: 'en' });
                  }
                }}
                className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
                style={{
                  backgroundColor: language === 'en' ? 'var(--primary)' : 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: language === 'en' ? 'var(--background)' : 'var(--foreground)',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  transition: 'transform 0.2s ease-in-out, background-color 0.2s',
                  fontSize: '12px',
                  fontFamily: 'Space Mono, monospace'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => {
                  if (language !== 'de') {
                    toggleLanguage();
                    updateURLParams({ lang: 'de' });
                  }
                }}
                className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
                style={{
                  backgroundColor: language === 'de' ? 'var(--primary)' : 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: language === 'de' ? 'var(--background)' : 'var(--foreground)',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                  transition: 'transform 0.2s ease-in-out, background-color 0.2s',
                  fontSize: '12px',
                  fontFamily: 'Space Mono, monospace'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Switch to German"
              >
                DE
              </button>
            </div>

      </div>

      {/* Main content area - with loading state */}
      {isLoading ? (
        <div className="loading-skeleton" style={{ marginTop: '40px' }}>
          <LoadingSkeleton />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-screen md:pl-16" style={{ marginTop: '40px' }}>
          {/* StoryList Panel - Visible on both mobile and desktop */}
          <div className="w-full md:w-1/3 h-1/2 md:h-screen order-2 md:order-1 flex-shrink-0">
            <StoryList
              visibleStories={enrichedStories}
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
              enrichedStories={enrichedStories}
              isTestMode={true}
            />
          </div>
        </div>
      )}

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden fixed top-14 left-4 w-10 h-10 flex items-center justify-center border backdrop-blur-sm cursor-pointer hover:opacity-80 hot-button"
        style={{ 
          zIndex: 10001,
          backgroundColor: 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)',
          cursor: 'pointer'
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
        <div className="md:hidden fixed top-26 left-4 border backdrop-blur-sm shadow-lg p-2 flex flex-col gap-2 hot-dropdown" 
             style={{ 
               zIndex: 10001,
               backgroundColor: 'var(--dropdown-bg)',
               borderColor: 'var(--border)'
             }}>
          {/* Theme Button */}
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button relative ${showThemeMenu ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: showThemeMenu ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: showThemeMenu ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer'
            }}
            aria-label="Switch theme"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z" />
            </svg>
          </button>
          
          {/* Home Button */}
          <button
            onClick={() => {
              goHome();
              setShowMobileMenu(false);
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${showIntro ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: showIntro ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: showIntro ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer'
            }}
            aria-label="Home"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>
          
          {/* Info Button */}
          <button
            onClick={() => {
              toggleInfo();
              setShowMobileMenu(false);
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${showInfo ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: showInfo ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: showInfo ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer'
            }}
            aria-label="Information"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          {/* Language Buttons for Mobile */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                if (language !== 'en') {
                  toggleLanguage();
                  updateURLParams({ lang: 'en' });
                }
                setShowMobileMenu(false);
              }}
              className="flex-1 h-12 flex items-center justify-center transition-all duration-200 border hot-button"
              style={{
                backgroundColor: language === 'en' ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: language === 'en' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'Space Mono, monospace'
              }}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => {
                if (language !== 'de') {
                  toggleLanguage();
                  updateURLParams({ lang: 'de' });
                }
                setShowMobileMenu(false);
              }}
              className="flex-1 h-12 flex items-center justify-center transition-all duration-200 border hot-button"
              style={{
                backgroundColor: language === 'de' ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: language === 'de' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'Space Mono, monospace'
              }}
              aria-label="Switch to German"
            >
              DE
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile Theme Menu Dropdown */}
      {showThemeMenu && showMobileMenu && (
        <div className="md:hidden fixed top-26 left-20 shadow-lg p-2 min-w-[120px] border hot-dropdown" style={{ 
          zIndex: 10002,
          backgroundColor: 'var(--dropdown-bg)',
          borderColor: 'var(--border)'
        }}>
          {['moody', 'bauhaus'].map((themeName) => (
            <button
              key={themeName}
              onClick={() => {
                handleThemeSwitch(themeName);
                setShowMobileMenu(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-mono transition-all capitalize`}
              style={{
                backgroundColor: mounted && theme === themeName ? 'var(--primary)' : 'transparent',
                color: mounted && theme === themeName ? 'var(--background)' : 'var(--foreground)',
                borderLeft: mounted && theme === themeName ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!mounted || theme !== themeName) {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                  e.currentTarget.style.color = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!mounted || theme !== themeName) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--foreground)';
                }
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {themeName === 'art-nouveau' ? 'Art Nouveau' : themeName}
            </button>
          ))}
        </div>
      )}

      {/* Intro Overlay - Slides to the left, but leaves sidebar visible */}
      <div 
        className={`fixed md:absolute top-10 left-0 md:left-16 right-0 bottom-0 backdrop-blur-sm transition-transform duration-700 ease-in-out overflow-hidden ${
          showIntro ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          zIndex: 9999,
          backgroundColor: 'rgba(var(--background-rgb), 0.98)'
        }}
      >
        {/* Animated Map Background with Ken Burns Effect - Lazy loaded */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute w-[200%] h-[200%] -top-[50%] -left-[50%]"
            style={{
              backgroundImage: showIntro ? `url('/berlin-map.png')` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: showIntro ? 'kenBurns 30s ease-in-out infinite alternate' : 'none',
              filter: 'contrast(1.2) brightness(0.9)'
            }}
          />
        </div>
        
        {/* Close button */}
        <button
          onClick={handleLetsGo}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center border transition-colors z-10 hover:opacity-80 hot-close-button"
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
            cursor: 'pointer'
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
                <h1 className="font-kame text-5xl sm:text-7xl md:text-8xl lg:text-9xl mb-4" style={{ color: 'var(--foreground)' }}>
                  {t('mainPage.intro.title')}
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  Berlin 1900-1945
                </p>
                <div className="mt-4 p-4 border border-yellow-500 bg-yellow-100 text-yellow-800 font-mono text-sm">
                  🚧 TEST VERSION: Full Dataset (10,000+ businesses) 🚧
                </div>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-base sm:text-lg md:text-xl leading-relaxed font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground)' }}>
                  Explore the complete dataset of over 10,000 Jewish-owned businesses that once 
                  formed the backbone of Berlin&apos;s commercial life.
                </p>
                <p className="text-sm sm:text-base md:text-lg font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  Navigate through time to witness their rise, struggles, and the tragic 
                  impact of Nazi persecution. This is a test environment with the full dataset.
                </p>
              </div>

              <div className="pt-8">
                <button
                  onClick={handleLetsGo}
                  className="group inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 text-xl sm:text-2xl md:text-3xl transition-all duration-200 font-kame border-2 hot-intro-button"
                  style={{
                    backgroundColor: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    color: '#ffffff',
                    letterSpacing: '0.08em',
                    cursor: 'pointer'
                  }}
                >
                  <span>Test Full Dataset</span>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              <div className="pt-12 text-sm font-mono" style={{ color: 'var(--muted)' }}>
                <p>Data: Dr. Christoph Kreutzmüller | Visualization: StoryTimeMaps | TEST ENVIRONMENT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel - Slides from the right */}
      <div 
        className={`fixed md:absolute right-0 top-10 bottom-0 h-full w-full md:w-1/2 lg:w-2/5 backdrop-blur-sm shadow-2xl transition-transform duration-500 ease-in-out overflow-hidden ${
          showInfo ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          zIndex: 9998,
          backgroundColor: 'rgba(var(--background-rgb), 0.98)'
        }}
      >
        {/* Animated Map Background with Ken Burns Effect - Lazy loaded */}
        <div className="absolute inset-0 opacity-15">
          <div 
            className="absolute w-[200%] h-[200%] -top-[50%] -right-[50%]"
            style={{
              backgroundImage: showInfo ? `url('/berlin-map.png')` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: showInfo ? 'kenBurnsReverse 25s ease-in-out infinite alternate' : 'none',
              filter: 'contrast(1.2) brightness(0.9)'
            }}
          />
        </div>
        
        <div className="relative h-full overflow-y-auto">
          <div className="p-8">
            {/* Close button */}
            <button
              onClick={() => {
                setShowInfo(false);
                updateURLParams({ about: false });
              }}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center border transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                cursor: 'pointer'
              }}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-8 pt-16 md:pt-0">
              <div>
                <h2 className="text-3xl font-light mb-2 font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground)' }}>{t('mainPage.info.title')}</h2>
                <div className="w-20 h-1" style={{ backgroundColor: 'var(--primary)' }} />
              </div>

              <div className="space-y-6 font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground)' }}>
                <div className="p-4 border border-red-500 bg-red-50 text-red-800">
                  <h3 className="font-semibold mb-2">⚠️ TEST ENVIRONMENT</h3>
                  <p>This page contains the complete dataset of 10,000+ businesses. Production data remains safe and unchanged.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>Full Dataset Features</h3>
                  <p className="leading-relaxed">
                    This test environment includes all scraped businesses from the HU Berlin database,
                    providing a comprehensive view of Jewish commercial life in Berlin from 1900-1945.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>Data Statistics</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Total businesses: 10,000+ records</li>
                    <li>• Geographic coverage: All Berlin districts</li>
                    <li>• Time period: 1900-1945</li>
                    <li>• Business types: Trade, services, manufacturing</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>Performance Testing</h3>
                  <p className="leading-relaxed">
                    Use this environment to test map performance with large datasets,
                    clustering algorithms, and timeline interactions at scale.
                  </p>
                </div>

                <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    🔒 Production environment remains at: <a href="/" className="underline">/ (main page)</a>
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

function TestFullDatasetPage() {
  return (
    <TranslationProvider>
      <TestFullDatasetPageContent />
    </TranslationProvider>
  );
}

export default function TestFullDatasetPageWrapper() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading test environment...</div>
      </div>
    }>
      <TestFullDatasetPage />
    </Suspense>
  );
}