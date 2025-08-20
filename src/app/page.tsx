'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import StoryList from './components/StoryList';
import LoadingSkeleton from './components/LoadingSkeleton';
import ModeToggle from './components/ModeToggle';
import ContentPreview from './components/ContentPreview';
import { useStoryMapLogicTest as useStoryMapLogic, berlinCoordinates, defaultZoom } from '../hooks/useStoryMapLogicTest';
import { useIsMounted } from '../hooks/useIsMounted';
import { TranslationProvider } from '../i18n/TranslationContext';
import { useTranslation } from '../i18n/useTranslation';

const MapboxMap = dynamic(() => import('./components/MapboxMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading map...</div>
    </div>
  )
});

function MapPageContent() {
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
  // const [isThemeSwitching, setIsThemeSwitching] = useState(false); // Removed - no longer needed
  
  // Force theme from URL to override localStorage
  useEffect(() => {
    if (!mounted) return;
    
    const themeParam = searchParams.get('theme');
    if (themeParam && ['moody', 'bauhaus', 'cool', 'warm', 'hot', 'cold', 'art-nouveau', 'archival'].includes(themeParam)) {
      // Force set theme from URL - no checking if different
      // Small timeout ensures it runs after next-themes loads from localStorage
      setTimeout(() => {
        setTheme(themeParam);
      }, 50);
    }
  }, [mounted, searchParams, setTheme]); // Re-run when URL changes
  
  // Handle non-theme URL parameters
  useEffect(() => {
    if (!mounted) return;
    
    // Check for about parameter
    const aboutParam = searchParams.get('about');
    if (aboutParam === 'true') {
      setShowInfo(true);
      setShowIntro(false);
    }
    
    // Show intro only on root page without significant params AND if not explicitly closed
    // Don't consider language/theme params as "significant" for intro display
    const significantParams = Array.from(searchParams.keys()).filter(
      key => key !== 'lang' && key !== 'theme'
    );
    const hasSignificantParams = significantParams.length > 0;
    
    if (hasSignificantParams) {
      setShowIntro(false);
    } else if (!introExplicitlyClosed) {
      // Only show intro if user hasn't explicitly closed it
      setShowIntro(true);
    }
  }, [searchParams, mounted, introExplicitlyClosed]);
  const {
    visibleStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers,
    setActiveStoryId,
    isLoading,
    totalItems,
    viewMode,
    setViewMode,
    storiesWithDetailCount
  } = useStoryMapLogic();



  const handleStoryClick = (storyId: string) => {
    setActiveStoryId(storyId);
    handleMarkerClick(storyId);
  };

  const handleThemeSwitch = useCallback((newTheme: string) => {
    if (!mounted || theme === newTheme) return;
    
    setShowThemeMenu(false);
    
    // Simply set the theme - let next-themes handle everything
    setTheme(newTheme);
    
    // Update URL parameter for sharing
    const params = new URLSearchParams(searchParams.toString());
    params.set('theme', newTheme);
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
  }, [mounted, theme, setTheme, searchParams, router]);

  const handleLetsGo = useCallback(() => {
    setShowIntro(false);
    setIntroExplicitlyClosed(true); // Mark that user explicitly closed intro
    // No sessionStorage - intro will show again on next visit to root
  }, []);

  const toggleInfo = useCallback(() => {
    const newShowInfo = !showInfo;
    setShowInfo(newShowInfo);
    const params = new URLSearchParams(searchParams.toString());
    if (newShowInfo) {
      params.set('about', 'true');
    } else {
      params.delete('about');
    }
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
    
    if (showIntro) {
      setShowIntro(false);
      setIntroExplicitlyClosed(true); // Mark as explicitly closed
    }
  }, [showInfo, showIntro, searchParams, router]);

  const goHome = useCallback(() => {
    // Navigate to root URL preserving language
    const params = new URLSearchParams();
    if (language) {
      params.set('lang', language);
    }
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
    setShowIntro(true);
    setIntroExplicitlyClosed(false); // Reset so intro shows when home is clicked
    setShowInfo(false);
  }, [router, language]);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Desktop Sidebar Navigation - Always render immediately */}
      <div className="hidden md:flex md:w-16 md:h-full flex-shrink-0 flex-col items-center py-6 gap-4 absolute left-0 top-0 backdrop-blur-sm hot-sidebar" 
           style={{ 
             zIndex: 10000,
             backgroundColor: 'var(--input-bg)',
             marginTop: '0'
           }}>
            {/* Theme Button */}
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border relative hot-button hover:scale-110 ${showThemeMenu ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: showThemeMenu ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: showThemeMenu ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out, background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
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
                {['moody', 'bauhaus', 'archival'].map((themeName) => (
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
                    {themeName === 'art-nouveau' ? 'Art Nouveau' : themeName}
                  </button>
                ))}
              </div>
            )}

            {/* Stories Mode Button */}
            <button
              onClick={() => {
                setViewMode('stories');
                if (showIntro) {
                  setShowIntro(false);
                  setIntroExplicitlyClosed(true);
                }
              }}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${viewMode === 'stories' ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: viewMode === 'stories' ? 'var(--success)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: viewMode === 'stories' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out, background-color 0.2s',
                fontSize: '10px',
                fontFamily: 'Space Mono, monospace',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Featured Stories mode"
              title="Featured Stories (15 detailed narratives)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
            
            {/* Database Mode Button */}
            <button
              onClick={() => {
                setViewMode('database');
                if (showIntro) {
                  setShowIntro(false);
                  setIntroExplicitlyClosed(true);
                }
              }}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${viewMode === 'database' ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: viewMode === 'database' ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: viewMode === 'database' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out, background-color 0.2s',
                fontSize: '10px',
                fontFamily: 'Space Mono, monospace',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Historical Database mode"
              title="Historical Database (10,000+ records)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </button>
            
            {/* Home Button */}
            <button
              onClick={goHome}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${showIntro ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: showIntro ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: showIntro ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out, background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
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
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${showInfo ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: showInfo ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: showInfo ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out, background-color 0.2s',
                fontSize: '18px',
                fontFamily: 'serif',
                fontStyle: 'italic',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Information"
            >
              i
            </button>

            {/* Bar Charts Button */}
            <a
              href="/barcharts"
              className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out, background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Data Visualizations"
              title="Interactive Bar Charts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </a>

            {/* Language Toggle Buttons */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  if (language !== 'en') {
                    toggleLanguage();
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('lang', 'en');
                    const queryString = params.toString();
                    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
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
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('lang', 'de');
                    const queryString = params.toString();
                    router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
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
        <div className="loading-skeleton">
          <LoadingSkeleton />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-screen md:pl-16">
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
              isTestMode={true}
            />
          </div>
        </div>
      )}

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden fixed left-4 w-10 h-10 flex items-center justify-center border backdrop-blur-sm cursor-pointer hover:opacity-80 hot-button"
        style={{ 
          top: '10px',
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
        <div className="md:hidden fixed left-4 border backdrop-blur-sm shadow-lg p-2 flex flex-col gap-2 hot-dropdown" 
             style={{ 
               top: '26px',
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
          
          {/* Stories Mode Button */}
          <button
            onClick={() => {
              setViewMode('stories');
              if (showIntro) {
                setShowIntro(false);
                setIntroExplicitlyClosed(true);
              }
              setShowMobileMenu(false);
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${viewMode === 'stories' ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: viewMode === 'stories' ? 'var(--success)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: viewMode === 'stories' ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: 'Space Mono, monospace',
              fontWeight: '600'
            }}
            aria-label="Featured Stories mode"
            title="Featured Stories (15 detailed narratives)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
          
          {/* Database Mode Button */}
          <button
            onClick={() => {
              setViewMode('database');
              if (showIntro) {
                setShowIntro(false);
                setIntroExplicitlyClosed(true);
              }
              setShowMobileMenu(false);
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${viewMode === 'database' ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: viewMode === 'database' ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: viewMode === 'database' ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: 'Space Mono, monospace',
              fontWeight: '600'
            }}
            aria-label="Historical Database mode"
            title="Historical Database (10,000+ records)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
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
              cursor: 'pointer',
              fontSize: '20px',
              fontFamily: 'serif',
              fontStyle: 'italic',
              fontWeight: '600'
            }}
            aria-label="Information"
          >
            i
          </button>
          
          {/* Bar Charts Button for Mobile */}
          <a
            href="/barcharts"
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
              cursor: 'pointer'
            }}
            aria-label="Data Visualizations"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </a>
          
          {/* Language Buttons for Mobile */}
          <button
            onClick={() => {
              if (language !== 'en') {
                toggleLanguage();
                const params = new URLSearchParams(searchParams.toString());
                params.set('lang', 'en');
                const queryString = params.toString();
                router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
              }
              // Don't close mobile menu on language change
            }}
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button"
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
                const params = new URLSearchParams(searchParams.toString());
                params.set('lang', 'de');
                const queryString = params.toString();
                router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
              }
              // Don't close mobile menu on language change
            }}
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button"
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
      )}
      
      {/* Mobile Theme Menu Dropdown */}
      {showThemeMenu && showMobileMenu && (
        <div className="md:hidden fixed left-20 shadow-lg p-2 min-w-[120px] border hot-dropdown" style={{ 
          top: '26px',
          zIndex: 10002,
          backgroundColor: 'var(--dropdown-bg)',
          borderColor: 'var(--border)'
        }}>
          {['moody', 'bauhaus', 'archival'].map((themeName) => (
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
        className={`fixed md:absolute top-0 left-0 md:left-16 right-0 bottom-0 backdrop-blur-sm transition-transform duration-700 ease-in-out overflow-hidden ${
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
        
        <div className="relative h-full flex items-start md:items-center justify-center px-4 sm:px-6 md:px-8 py-8 md:py-0 overflow-y-auto" style={{ marginTop: '2rem' }}>
          <div className="max-w-4xl mx-auto text-center relative z-10">

            <div className="relative space-y-8">
              <div>
                <h1 className="font-kame text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4" style={{ color: 'var(--foreground)' }}>
                  {t('mainPage.intro.title')}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-light font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  {t('mainPage.intro.subtitle')}
                </p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground)' }}>
                  {t('mainPage.intro.description1')}
                </p>
                <p className="text-xs sm:text-sm md:text-base font-['Space_Mono'] font-mono" style={{ color: 'var(--foreground-muted)' }}>
                  {t('mainPage.intro.description2')}
                </p>
              </div>

              {/* Mode Selection */}
              <div className="pt-4 max-w-4xl mx-auto">
                <ModeToggle
                  mode={viewMode}
                  onModeChange={(newMode) => {
                    setViewMode(newMode);
                    // Close intro overlay when mode is selected from the overlay
                    setShowIntro(false);
                    setIntroExplicitlyClosed(true);
                  }}
                  storiesCount={storiesWithDetailCount}
                  totalCount={totalItems}
                  theme={mounted ? theme : undefined}
                />
                <ContentPreview
                  mode={viewMode}
                  storiesCount={storiesWithDetailCount}
                  totalCount={totalItems}
                />
              </div>

              <div className="pt-12 text-sm font-mono" style={{ color: 'var(--muted)' }}>
                <p>{t('mainPage.intro.credits')}</p>
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
                const params = new URLSearchParams(searchParams.toString());
                params.delete('about');
                const queryString = params.toString();
                router.push(queryString ? `/?${queryString}` : '/', { scroll: false });
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
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>{t('mainPage.info.historicalContext')}</h3>
                  <p className="leading-relaxed">
                    {t('mainPage.info.historicalContextDesc')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>{t('mainPage.info.theData')}</h3>
                  <p className="leading-relaxed">
                    {t('mainPage.info.theDataDesc')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>{t('mainPage.info.timelineNavigation')}</h3>
                  <p className="leading-relaxed">
                    {t('mainPage.info.timelineNavigationDesc')}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>{t('mainPage.info.colorCoding')}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4" style={{ backgroundColor: 'var(--success)' }} />
                      <span>{t('mainPage.info.activeBusinesses')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4" style={{ backgroundColor: 'var(--warning)' }} />
                      <span>{t('mainPage.info.businessesUnderPressure')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-4 h-4" style={{ backgroundColor: 'var(--danger)' }} />
                      <span>{t('mainPage.info.closedLiquidated')}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>{t('mainPage.info.researchTeam')}</h3>
                  <p className="leading-relaxed">
                    <strong>Dr. Christoph Kreutzmüller</strong><br />
                    {t('mainPage.info.researchTeamDesc1')}<br />
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{t('mainPage.info.researchTeamDesc2')}</span>
                  </p>
                  <p className="leading-relaxed mt-3">
                    <strong>StoryTimeMaps</strong><br />
                    {t('mainPage.info.researchTeamDesc3')}<br />
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{t('mainPage.info.researchTeamDesc4')}</span>
                  </p>
                </div>

                <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    {t('mainPage.info.academicCitation')}
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

function MapPage() {
  return (
    <TranslationProvider>
      <MapPageContent />
    </TranslationProvider>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading test environment...</div>
      </div>
    }>
      <MapPage />
    </Suspense>
  );
}