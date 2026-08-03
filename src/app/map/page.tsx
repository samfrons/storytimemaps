'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useTheme } from 'next-themes'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import StoryList from '../components/StoryList'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ModeToggle from '../components/ModeToggle'
import ContentPreview from '../components/ContentPreview'
import NavigationSidebar from '../components/NavigationSidebar'
import PlaquesHero from '../components/PlaquesHero'
import {
  useStoryMapLogicTest as useStoryMapLogic,
  berlinCoordinates,
  defaultZoom,
} from '../../hooks/useStoryMapLogicTest'
import { useIsMounted } from '../../hooks/useIsMounted'
// TranslationProvider now in root layout
import { useTranslation } from '../../i18n/useTranslation'

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

function MapPageContent() {
  const { t, language, toggleLanguage, switchToLanguage } = useTranslation()
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
  // const [isThemeSwitching, setIsThemeSwitching] = useState(false); // Removed - no longer needed

  // CRITICAL: Set theme from URL on initial mount ONLY - DO NOT add URL/theme to deps
  // This prevents double-setting when we update the URL after theme change
  useEffect(() => {
    if (!mounted) return

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
      ].includes(themeParam)
    ) {
      // Only set theme if it's different from current theme
      if (theme !== themeParam) {
        setTheme(themeParam)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]) // WARNING: Only run on mount - adding deps will cause theme flashing!

  // Handle non-theme URL parameters
  useEffect(() => {
    if (!mounted) return

    // Check for about parameter
    const aboutParam = searchParams.get('about')
    if (aboutParam === 'true') {
      setShowInfo(true)
      setShowIntro(false)
    }

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
  }, [searchParams, mounted, introExplicitlyClosed])

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

  // State for deep link auto-open
  const [deepLinkId, setDeepLinkId] = useState<string | null>(null)

  // Handle ?id= parameter for deep linking to specific businesses
  useEffect(() => {
    if (!mounted || isLoading) return

    const idParam = searchParams.get('id')
    if (idParam) {
      // Set to stories mode and select the business
      setViewMode('stories')
      setActiveStoryId(idParam)
      handleMarkerClick(idParam)
      setShowIntro(false)
      setIntroExplicitlyClosed(true)
      // Set deep link ID to auto-open the detail modal
      setDeepLinkId(idParam)
    }
  }, [mounted, isLoading, searchParams, setViewMode, setActiveStoryId, handleMarkerClick])

  const handleStoryClick = useCallback(
    (storyId: string) => {
      setActiveStoryId(storyId)
      handleMarkerClick(storyId)
    },
    [setActiveStoryId, handleMarkerClick]
  )

  const handleThemeSwitch = useCallback(
    (newTheme: string) => {
      if (!mounted || theme === newTheme) return

      setShowThemeMenu(false)

      // Set the theme
      setTheme(newTheme)

      // Update URL for sharing (using replace to avoid history spam)
      const params = new URLSearchParams(searchParams.toString())
      params.set('theme', newTheme)
      const queryString = params.toString()
      router.replace(queryString ? `/map?${queryString}` : '/map', { scroll: false })
    },
    [mounted, theme, setTheme, searchParams, router]
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
    router.push(queryString ? `/map?${queryString}` : '/map', { scroll: false })

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
    router.push(queryString ? `/map?${queryString}` : '/map', { scroll: false })
    setShowIntro(true)
    setIntroExplicitlyClosed(false) // Reset so intro shows when home is clicked
    setShowInfo(false)
  }, [router, language])

  // Memoized callback for closing intro
  const handleCloseIntro = useCallback(() => {
    setShowIntro(false)
    setIntroExplicitlyClosed(true)
  }, [])

  // Memoized callback for language change
  const handleLanguageChange = useCallback(
    (lang: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('lang', lang)
      const queryString = params.toString()
      router.push(queryString ? `/map?${queryString}` : '/map', { scroll: false })
    },
    [searchParams, router]
  )

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Navigation Sidebar - Extracted component for better performance */}
      <NavigationSidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        showThemeMenu={showThemeMenu}
        setShowThemeMenu={setShowThemeMenu}
        theme={theme}
        mounted={mounted}
        onThemeSwitch={handleThemeSwitch}
        showIntro={showIntro}
        onCloseIntro={handleCloseIntro}
        goHome={goHome}
        showInfo={showInfo}
        toggleInfo={toggleInfo}
        language={language}
        switchToLanguage={switchToLanguage}
        onLanguageChange={handleLanguageChange}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />

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
              autoOpenDetailId={deepLinkId}
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

      {/* Intro Overlay - Slides to the left, but leaves sidebar visible */}
      <div
        className={`fixed md:absolute top-0 left-0 md:left-16 right-0 bottom-0 backdrop-blur-sm transition-transform duration-700 ease-in-out overflow-hidden ${
          showIntro ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          zIndex: 9999,
          backgroundColor: 'rgba(var(--background-rgb), 0.95)',
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
          className="absolute w-10 h-10 flex items-center justify-center border transition-colors z-10 hover:opacity-80 hot-close-button"
          style={{
            top: 'max(2vh, 1rem)',
            right: 'max(2vw, 1rem)',
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

        <div
          className="relative min-h-full flex items-center justify-center px-4 sm:px-6 md:px-8 overflow-y-auto"
          style={{
            paddingTop: 'max(2vh, 1rem)',
            paddingBottom: 'max(2vh, 1rem)',
            minHeight: '100vh',
          }}
        >
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="relative space-y-8">
              <div>
                <h1
                  className="font-kame text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t('mainPage.intro.title')}
                </h1>
                <p
                  className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-light font-['Space_Mono'] font-mono"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('mainPage.intro.subtitle')}
                </p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <p
                  className="text-sm sm:text-base md:text-lg leading-relaxed font-['Space_Mono'] font-mono"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t('mainPage.intro.description1')}
                </p>
                <p
                  className="text-xs sm:text-sm md:text-base font-['Space_Mono'] font-mono"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('mainPage.intro.description2')}
                </p>
              </div>

              {/* Mode Selection */}
              <div className="pt-4 max-w-4xl mx-auto">
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

              {/* Memorial Plaques Initiative Teaser */}
              <div className="pt-8 max-w-2xl mx-auto">
                <PlaquesHero compact={true} showFullContent={false} />
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
          backgroundColor: 'rgba(var(--background-rgb), 0.95)',
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
          <div
            style={{
              padding: 'max(2vh, 1rem) max(2vw, 1rem)',
              paddingTop: 'max(4vh, 3rem)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowInfo(false)
                const params = new URLSearchParams(searchParams.toString())
                params.delete('about')
                const queryString = params.toString()
                router.push(queryString ? `/map?${queryString}` : '/map', { scroll: false })
              }}
              className="absolute w-10 h-10 flex items-center justify-center border transition-colors hover:opacity-80"
              style={{
                top: 'max(2vh, 1rem)',
                right: 'max(2vw, 1rem)',
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

            <div className="space-y-8">
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
    </div>
  )
}

function MapPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="font-mono" style={{ color: 'var(--primary)' }}>
            Loading...
          </div>
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  )
}

export default function MapRoute() {
  return <MapPage />
}
