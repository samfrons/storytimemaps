'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useTheme } from 'next-themes'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import StoryList from '../components/StoryList'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ModeToggle from '../components/ModeToggle'
import ContentPreview from '../components/ContentPreview'
import {
  useStoryMapLogicTest as useStoryMapLogic,
  berlinCoordinates,
  defaultZoom,
} from '../../hooks/useStoryMapLogicTest'
import { useIsMounted } from '../../hooks/useIsMounted'
// TranslationProvider now in root layout
import { useTranslation } from '../../i18n/useTranslation'
import { OverlayCopyright } from '../components/SiteFooter'

const MapboxMap = dynamic(() => import('../components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="font-mono" style={{ color: 'var(--primary)' }}>
        Loading map...
      </div>
    </div>
  ),
})

function TestFullDatasetPageContent() {
  const { t, language, toggleLanguage } = useTranslation()
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Always show intro on root page unless there are URL params
  const hasUrlParams = searchParams.toString() !== ''
  const [showIntro, setShowIntro] = useState(!hasUrlParams)
  const [introExplicitlyClosed, setIntroExplicitlyClosed] = useState(false) // Track if user closed intro
  const [showInfo, setShowInfo] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  // Sync with URL parameters on mount and when they change
  useEffect(() => {
    if (!mounted) return

    // Check for about parameter
    const aboutParam = searchParams.get('about')
    if (aboutParam === 'true') {
      setShowInfo(true)
      setShowIntro(false)
    }

    // Check for theme parameter - only set if different from current
    const themeParam = searchParams.get('theme')
    if (
      themeParam &&
      [
        'moody',
        'bauhaus',
        'cool',
        'warm',
        'hot',
        'cold',
        'art-nouveau',
        'archival',
        'hoefe',
        'brutal-pop',
      ].includes(themeParam)
    ) {
      if (theme !== themeParam) {
        setTheme(themeParam)
      }
    }
    // No fallback theme here on purpose. This page used to set 'archival' when
    // nothing was stored, which wrote to the shared theme storage and left every
    // other page in that theme afterwards. The provider's default (brutal-pop)
    // is the only thing that should decide an unset theme.

    // Show intro only on root page without significant params AND if not explicitly closed
    // Don't consider language/theme params as "significant" for intro display
    const significantParams = Array.from(searchParams.keys()).filter(
      (key) => key !== 'lang' && key !== 'theme'
    )
    const hasSignificantParams = significantParams.length > 0

    if (hasSignificantParams) {
      setShowIntro(false)
    } else if (!introExplicitlyClosed) {
      // Only show intro if user hasn't explicitly closed it
      setShowIntro(true)
    }
  }, [searchParams, mounted, setTheme, introExplicitlyClosed, theme])
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
    storiesWithDetailCount,
  } = useStoryMapLogic()

  const handleStoryClick = (storyId: string) => {
    setActiveStoryId(storyId)
    handleMarkerClick(storyId)
  }

  const handleThemeSwitch = useCallback(
    (newTheme: string) => {
      if (!mounted) return
      setShowThemeMenu(false)
      // Set theme immediately to avoid flicker
      setTheme(newTheme)
      // Update URL parameter
      const params = new URLSearchParams(searchParams.toString())
      params.set('theme', newTheme)
      const queryString = params.toString()
      router.push(queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset', {
        scroll: false,
      })
    },
    [mounted, setTheme, searchParams, router]
  )

  const handleLetsGo = useCallback(() => {
    setShowIntro(false)
    setIntroExplicitlyClosed(true) // Mark that user explicitly closed intro
    // No sessionStorage - intro will show again on next visit to root
  }, [])

  const toggleInfo = useCallback(() => {
    const newShowInfo = !showInfo
    setShowInfo(newShowInfo)
    const params = new URLSearchParams(searchParams.toString())
    if (newShowInfo) {
      params.set('about', 'true')
    } else {
      params.delete('about')
    }
    const queryString = params.toString()
    router.push(queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset', {
      scroll: false,
    })

    if (showIntro) {
      setShowIntro(false)
      setIntroExplicitlyClosed(true) // Mark as explicitly closed
    }
  }, [showInfo, showIntro, searchParams, router])

  const goHome = useCallback(() => {
    // Navigate to root URL preserving language
    const params = new URLSearchParams()
    if (language) {
      params.set('lang', language)
    }
    const queryString = params.toString()
    router.push(queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset', {
      scroll: false,
    })
    setShowIntro(true)
    setIntroExplicitlyClosed(false) // Reset so intro shows when home is clicked
    setShowInfo(false)
  }, [router, language])

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Desktop Sidebar Navigation - Always render immediately */}
      <div
        className="hidden md:flex md:w-16 md:h-full flex-shrink-0 flex-col items-center py-6 gap-4 absolute left-0 top-0 backdrop-blur-sm hot-sidebar"
        style={{
          zIndex: 10000,
          backgroundColor: 'var(--input-bg)',
          marginTop: '0',
        }}
      >
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
            transition: 'transform 0.2s ease-in-out, background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Switch theme"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z"
            />
          </svg>
        </button>

        {/* Theme Menu Dropdown */}
        {showThemeMenu && (
          <div
            className="absolute top-16 left-0 border backdrop-blur-sm shadow-lg p-2 min-w-[120px] hot-dropdown"
            style={{
              zIndex: 10001,
              backgroundColor: 'var(--dropdown-bg)',
              borderColor: 'var(--border)',
            }}
          >
            {['moody', 'bauhaus', 'archival'].map((themeName) => (
              <button
                key={themeName}
                onClick={() => handleThemeSwitch(themeName)}
                className={`w-full px-3 py-2 text-left text-xs font-mono transition-all capitalize ${mounted && theme === themeName ? 'dropdown-active' : ''}`}
                style={{
                  backgroundColor:
                    mounted && theme === themeName ? 'var(--primary)' : 'transparent',
                  color: mounted && theme === themeName ? 'var(--background)' : 'var(--foreground)',
                  borderLeft:
                    mounted && theme === themeName
                      ? '2px solid var(--primary)'
                      : '2px solid transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!mounted || theme !== themeName) {
                    e.currentTarget.style.backgroundColor = 'var(--muted)'
                    e.currentTarget.style.color = 'var(--primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!mounted || theme !== themeName) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--foreground)'
                  }
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {themeName === 'art-nouveau' ? 'Art Nouveau' : themeName}
              </button>
            ))}
          </div>
        )}

        {/* Stories Mode Button */}
        <button
          onClick={() => setViewMode('stories')}
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
            fontWeight: '600',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Featured Stories mode"
          title="Featured Stories (15 detailed narratives)"
        >
          15
        </button>

        {/* Database Mode Button */}
        <button
          onClick={() => setViewMode('database')}
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
            fontWeight: '600',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Historical Database mode"
          title="Historical Database (10,000+ records)"
        >
          DB
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
            transition: 'transform 0.2s ease-in-out, background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
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
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Information"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>

        {/* Language Toggle Buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              if (language !== 'en') {
                toggleLanguage()
                const params = new URLSearchParams(searchParams.toString())
                params.set('lang', 'en')
                const queryString = params.toString()
                router.push(
                  queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset',
                  { scroll: false }
                )
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
              fontFamily: 'Space Mono, monospace',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            onClick={() => {
              if (language !== 'de') {
                toggleLanguage()
                const params = new URLSearchParams(searchParams.toString())
                params.set('lang', 'de')
                const queryString = params.toString()
                router.push(
                  queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset',
                  { scroll: false }
                )
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
              fontFamily: 'Space Mono, monospace',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
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
          cursor: 'pointer',
        }}
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {showMobileMenu ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed left-4 border backdrop-blur-sm shadow-lg p-2 flex flex-col gap-2 hot-dropdown"
          style={{
            top: '26px',
            zIndex: 10001,
            backgroundColor: 'var(--dropdown-bg)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Theme Button */}
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu)
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button relative ${showThemeMenu ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: showThemeMenu ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: showThemeMenu ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
            }}
            aria-label="Switch theme"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V5z"
              />
            </svg>
          </button>

          {/* Home Button */}
          <button
            onClick={() => {
              goHome()
              setShowMobileMenu(false)
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${showIntro ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: showIntro ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: showIntro ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
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
              toggleInfo()
              setShowMobileMenu(false)
            }}
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${showInfo ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: showInfo ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: showInfo ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
            }}
            aria-label="Information"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>

          {/* Language Buttons for Mobile */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                if (language !== 'en') {
                  toggleLanguage()
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('lang', 'en')
                  const queryString = params.toString()
                  router.push(
                    queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset',
                    { scroll: false }
                  )
                }
                // Don't close mobile menu on language change
              }}
              className="flex-1 h-12 flex items-center justify-center transition-all duration-200 border hot-button"
              style={{
                backgroundColor: language === 'en' ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: language === 'en' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'Space Mono, monospace',
              }}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => {
                if (language !== 'de') {
                  toggleLanguage()
                  const params = new URLSearchParams(searchParams.toString())
                  params.set('lang', 'de')
                  const queryString = params.toString()
                  router.push(
                    queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset',
                    { scroll: false }
                  )
                }
                // Don't close mobile menu on language change
              }}
              className="flex-1 h-12 flex items-center justify-center transition-all duration-200 border hot-button"
              style={{
                backgroundColor: language === 'de' ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: language === 'de' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'Space Mono, monospace',
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
        <div
          className="md:hidden fixed left-20 shadow-lg p-2 min-w-[120px] border hot-dropdown"
          style={{
            top: '26px',
            zIndex: 10002,
            backgroundColor: 'var(--dropdown-bg)',
            borderColor: 'var(--border)',
          }}
        >
          {['moody', 'bauhaus', 'archival'].map((themeName) => (
            <button
              key={themeName}
              onClick={() => {
                handleThemeSwitch(themeName)
                setShowMobileMenu(false)
              }}
              className={`w-full px-3 py-2 text-left text-xs font-mono transition-all capitalize`}
              style={{
                backgroundColor: mounted && theme === themeName ? 'var(--primary)' : 'transparent',
                color: mounted && theme === themeName ? 'var(--background)' : 'var(--foreground)',
                borderLeft:
                  mounted && theme === themeName
                    ? '2px solid var(--primary)'
                    : '2px solid transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!mounted || theme !== themeName) {
                  e.currentTarget.style.backgroundColor = 'var(--muted)'
                  e.currentTarget.style.color = 'var(--primary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!mounted || theme !== themeName) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--foreground)'
                }
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
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
          backgroundColor: 'rgba(var(--background-rgb), 0.98)',
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
              filter: 'contrast(1.2) brightness(0.9)',
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
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 md:px-8 py-16 md:py-0">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="relative space-y-8">
              <div>
                <h1
                  className="font-kame text-5xl sm:text-7xl md:text-8xl lg:text-9xl mb-4"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t('mainPage.intro.title')}
                </h1>
                <p
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light font-['Space_Mono'] font-mono"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Berlin 1900-1945
                </p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p
                  className="text-base sm:text-lg md:text-xl leading-relaxed font-['Space_Mono'] font-mono"
                  style={{ color: 'var(--foreground)' }}
                >
                  Explore the complete dataset of over 10,000 Jewish-owned businesses that once
                  formed the backbone of Berlin&apos;s commercial life.
                </p>
                <p
                  className="text-sm sm:text-base md:text-lg font-['Space_Mono'] font-mono"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  Navigate through time to witness their rise, struggles, and the tragic impact of
                  Nazi persecution.
                </p>
              </div>

              {/* Mode Selection */}
              <div className="pt-8 max-w-4xl mx-auto">
                <ModeToggle
                  mode={viewMode}
                  onModeChange={(newMode) => {
                    setViewMode(newMode)
                    // Close intro overlay when mode is selected from the overlay
                    setShowIntro(false)
                    setIntroExplicitlyClosed(true)
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

              <div className="pt-8">
                <button
                  onClick={handleLetsGo}
                  className="group inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 text-xl sm:text-2xl md:text-3xl transition-all duration-200 font-kame border-2 hot-intro-button"
                  style={{
                    backgroundColor: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    color: '#ffffff',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  <span>{t('mainPage.intro.letsExplore')}</span>
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
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
          backgroundColor: 'rgba(var(--background-rgb), 0.98)',
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
              filter: 'contrast(1.2) brightness(0.9)',
            }}
          />
        </div>

        <div className="relative h-full overflow-y-auto">
          <div className="p-8">
            {/* Close button */}
            <button
              onClick={() => {
                setShowInfo(false)
                const params = new URLSearchParams(searchParams.toString())
                params.delete('about')
                const queryString = params.toString()
                router.push(
                  queryString ? `/test-full-dataset?${queryString}` : '/test-full-dataset',
                  { scroll: false }
                )
              }}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center border transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                cursor: 'pointer',
              }}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="space-y-8 pt-16 md:pt-0">
              <div>
                <h2
                  className="text-3xl font-light mb-2 font-['Space_Mono'] font-mono"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t('mainPage.info.title')}
                </h2>
                <div className="w-20 h-1" style={{ backgroundColor: 'var(--primary)' }} />
              </div>

              <div
                className="space-y-6 font-['Space_Mono'] font-mono"
                style={{ color: 'var(--foreground)' }}
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    {t('mainPage.info.historicalContext')}
                  </h3>
                  <p className="leading-relaxed">{t('mainPage.info.historicalContextDesc')}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    {t('mainPage.info.theData')}
                  </h3>
                  <p className="leading-relaxed">{t('mainPage.info.theDataDesc')}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    {t('mainPage.info.timelineNavigation')}
                  </h3>
                  <p className="leading-relaxed">{t('mainPage.info.timelineNavigationDesc')}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    {t('mainPage.info.colorCoding')}
                  </h3>
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
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    {t('mainPage.info.researchTeam')}
                  </h3>
                  <p className="leading-relaxed">
                    <strong>Dr. Christoph Kreutzmüller</strong>
                    <br />
                    {t('mainPage.info.researchTeamDesc1')}
                    <br />
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      {t('mainPage.info.researchTeamDesc2')}
                    </span>
                  </p>
                  <p className="leading-relaxed mt-3">
                    <strong>StoryTimeMaps</strong>
                    <br />
                    {t('mainPage.info.researchTeamDesc3')}
                    <br />
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      {t('mainPage.info.researchTeamDesc4')}
                    </span>
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

      <OverlayCopyright />
    </div>
  )
}

function TestFullDatasetPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="font-mono" style={{ color: 'var(--primary)' }}>
            Loading test environment...
          </div>
        </div>
      }
    >
      <TestFullDatasetPageContent />
    </Suspense>
  )
}

export default function TestFullDatasetPageWrapper() {
  return <TestFullDatasetPage />
}
