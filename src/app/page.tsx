'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useTheme } from 'next-themes'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import StoryList from './components/StoryList'
import LoadingSkeleton from './components/LoadingSkeleton'
import ModeToggle from './components/ModeToggle'
import ContentPreview from './components/ContentPreview'
import NavigationSidebar from './components/NavigationSidebar'
import TimeSlider from './components/TimeSlider'
import PlaquesHero from './components/PlaquesHero'
import {
  useStoryMapLogicTest as useStoryMapLogic,
  berlinCoordinates,
  defaultZoom,
} from '../hooks/useStoryMapLogicTest'
import { useIsMounted } from '../hooks/useIsMounted'
import { ALL_CATEGORIES } from '../utils/businessSectors'
// TranslationProvider now in root layout
import { useTranslation } from '../i18n/useTranslation'

const MapboxMap = dynamic(() => import('./components/MapboxMap'), {
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

  // Two layouts for the same map:
  //   'split'  - the original: list column on the left, time slider inside its header.
  //   'drawer' - list collapses to an edge tab and the slider floats over the map, so the
  //              canvas gets the full width. Needs MapboxMap's ResizeObserver to actually
  //              deliver pixels; mapbox-gl only watches window.resize on its own.
  // Default stays 'split' so existing links and habits are unchanged.
  const [layoutMode, setLayoutMode] = useState<'split' | 'drawer'>('split')
  const [isListOpen, setIsListOpen] = useState(true)
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
        'brutal-pop',
      ].includes(themeParam)
    ) {
      // Only set theme if it's different from current theme
      if (theme !== themeParam) {
        setTheme(themeParam)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]) // WARNING: Only run on mount - adding deps will cause theme flashing!

  // Resolve the layout preference on mount only. Kept deliberately separate from the theme
  // effect above: that one must never gain dependencies, and mixing concerns into it is how
  // theme flashing gets reintroduced. URL wins over the stored preference so a shared link
  // shows what the sender saw.
  useEffect(() => {
    if (!mounted) return

    const layoutParam = searchParams.get('layout')
    const stored = typeof window !== 'undefined' ? localStorage.getItem('storymap-layout') : null
    const resolved = layoutParam === 'drawer' || layoutParam === 'split' ? layoutParam : stored

    if (resolved === 'drawer' || resolved === 'split') {
      setLayoutMode(resolved)
      // In drawer mode the list starts collapsed - that is the point of the layout. `?list=1`
      // reopens it so a link can share the expanded state.
      if (resolved === 'drawer') {
        setIsListOpen(searchParams.get('list') === '1')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

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
    // Don't consider language/theme params as "significant" for intro display.
    // 'layout' and 'list' are presentation-only too: they describe how the page is arranged,
    // not what the visitor asked to see. Leaving them out of this filter would mean the first
    // drawer toggle permanently suppresses the intro, including for anyone given that URL.
    const significantParams = Array.from(searchParams.keys()).filter(
      (key) => key !== 'lang' && key !== 'theme' && key !== 'layout' && key !== 'list'
    )
    const hasSignificantParams = significantParams.length > 0

    if (hasSignificantParams) {
      setShowIntro(false)
    } else if (!introExplicitlyClosed) {
      // Only show intro if user hasn't explicitly closed it
      setShowIntro(true)
    }
  }, [searchParams, mounted, introExplicitlyClosed])

  // Owned here rather than inside StoryList so the map legend and the sidebar
  // dropdown drive the same filter.
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)

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
    unlocatedCount,
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
      // A deep link points at one record, so the list has to be on screen for it to land in -
      // otherwise the drawer stays shut and the linked business appears to do nothing.
      setIsListOpen(true)
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
      router.replace(queryString ? `/?${queryString}` : '/', { scroll: false })
    },
    [mounted, theme, setTheme, searchParams, router]
  )

  // Mirrors handleThemeSwitch exactly: set state first, then router.replace (never push) so
  // the layout is shareable without spamming history.
  const handleLayoutSwitch = useCallback(
    (nextLayout: 'split' | 'drawer') => {
      if (!mounted || layoutMode === nextLayout) return

      setLayoutMode(nextLayout)
      // Entering drawer mode collapses the list - that is what buys the map its width.
      // Leaving it restores the list so 'split' always looks like the original layout.
      setIsListOpen(nextLayout === 'split')

      try {
        localStorage.setItem('storymap-layout', nextLayout)
      } catch {
        // Private mode / storage disabled - the URL param still carries the choice.
      }

      const params = new URLSearchParams(searchParams.toString())
      params.set('layout', nextLayout)
      params.delete('list')
      const queryString = params.toString()
      router.replace(queryString ? `/?${queryString}` : '/', { scroll: false })
    },
    [mounted, layoutMode, searchParams, router]
  )

  const handleToggleList = useCallback(() => {
    setIsListOpen((open) => {
      const next = !open
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set('list', '1')
      else params.delete('list')
      const queryString = params.toString()
      router.replace(queryString ? `/?${queryString}` : '/', { scroll: false })
      return next
    })
  }, [searchParams, router])

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
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false })

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
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false })
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
      router.push(queryString ? `/?${queryString}` : '/', { scroll: false })
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
        layoutMode={layoutMode}
        onLayoutSwitch={handleLayoutSwitch}
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
        // `relative` is required: in drawer mode the list panel, the tab and the scrubber are
        // absolutely positioned and must resolve against this box, not the viewport.
        <div className="relative flex flex-col md:flex-row h-screen md:pl-12">
          {/* StoryList Panel.
              In 'split' it is a real column beside the map. In 'drawer' it becomes an overlay
              that slides off-canvas, and the map below takes the full width.

              It stays MOUNTED when collapsed, deliberately. MapboxMap opens a business by
              finding that story's card in the DOM and clicking its button, so unmounting the
              list here would silently break every map pin. Translating it off-canvas keeps the
              nodes addressable and keeps the progressive loader running. */}
          <div
            className={
              layoutMode === 'drawer'
                ? `absolute top-0 bottom-0 left-0 md:left-12 w-full md:w-[360px] transition-transform duration-300 ease-out will-change-transform ${
                    isListOpen ? 'translate-x-0' : '-translate-x-full'
                  }`
                : 'w-full md:w-1/3 h-1/2 md:h-screen order-2 md:order-1 flex-shrink-0'
            }
            style={layoutMode === 'drawer' ? { zIndex: 800 } : undefined}
            id="storymap-list-panel"
            aria-hidden={layoutMode === 'drawer' && !isListOpen}
          >
            <StoryList
              visibleStories={visibleStories}
              activeStoryId={activeStoryId}
              minDate={minDate}
              maxDate={maxDate}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              onStoryClick={handleStoryClick}
              autoOpenDetailId={deepLinkId}
              unlocatedCount={unlocatedCount}
              hideTimeSlider={layoutMode === 'drawer'}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Map Layer - full width in drawer mode, remaining space in split mode */}
          <div
            className={
              layoutMode === 'drawer'
                ? 'w-full flex-1 h-screen relative'
                : 'w-full md:flex-1 h-1/2 md:h-screen order-1 md:order-2 relative'
            }
          >
            <MapboxMap
              center={berlinCoordinates}
              zoom={defaultZoom}
              markers={testMarkers}
              onMarkerClick={handleStoryClick}
              activeMarkerId={activeStoryId}
              currentDate={currentDate}
              enrichedStories={visibleStories}
              isTestMode={true}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Drawer tab. Placed after the map in the DOM so tab order runs
              rail -> map -> tab -> scrubber rather than jumping backwards. */}
          {layoutMode === 'drawer' && (
            <button
              type="button"
              onClick={handleToggleList}
              aria-expanded={isListOpen}
              aria-controls="storymap-list-panel"
              className="hidden md:flex absolute top-0 bottom-0 w-11 items-center justify-center border-r transition-transform duration-300 ease-out will-change-transform"
              style={{
                left: isListOpen ? 'calc(3rem + 360px)' : '3rem',
                zIndex: 801,
                // NOT var(--input-bg): several themes define that as a translucent tint meant to
                // sit on a solid --background (moody is rgba(...,0.5)). Floating over the map it
                // would be see-through. rgba(var(--background-rgb), …) is the project's existing
                // idiom for map overlays and every theme defines --background-rgb.
                backgroundColor: 'rgba(var(--background-rgb), 0.95)',
                borderRightColor: 'var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
                boxShadow: 'none',
                cursor: 'pointer',
              }}
            >
              <span className="flex flex-col items-center gap-3">
                {/* Chevron points the way the panel will move, so the strip reads as a control
                    rather than a label. */}
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isListOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                  />
                </svg>
                <span
                  className="font-mono text-xs uppercase tracking-widest whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {isListOpen ? 'Hide list' : `${visibleStories.length.toLocaleString()} locations`}
                </span>
              </span>
            </button>
          )}

          {/* Mobile drawer tab - a bottom bar, since a vertical edge tab is unusable at 390px */}
          {layoutMode === 'drawer' && (
            <button
              type="button"
              onClick={handleToggleList}
              aria-expanded={isListOpen}
              aria-controls="storymap-list-panel"
              className="md:hidden fixed left-0 right-0 h-11 flex items-center justify-center border-t font-mono text-xs uppercase tracking-widest"
              style={{
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                zIndex: 801,
                backgroundColor: 'rgba(var(--background-rgb), 0.95)',
                borderTopColor: 'var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
                boxShadow: 'none',
                cursor: 'pointer',
              }}
            >
              {isListOpen ? 'Hide list' : `${visibleStories.length.toLocaleString()} locations`}
            </button>
          )}

          {/* Floating scrubber. Only in drawer mode - in split mode the slider stays in the
              list header where it has always been. Centred on the MAP box, not the viewport,
              so it does not drift under the panel when the drawer is open.
              Uses dvh-safe bottom insets: with a fixed bottom offset, iOS Safari's dynamic
              toolbar would otherwise crop it. */}
          {layoutMode === 'drawer' && (
            <div
              className="fixed md:absolute"
              style={{
                zIndex: 900,
                bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
                left: 0,
                right: 0,
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
                pointerEvents: 'none',
              }}
            >
              <div
                className="mx-auto border px-4 py-2"
                style={{
                  maxWidth: 'min(640px, 92vw)',
                  // Same reason as the tab: --card-bg is a translucent tint in several themes
                  // (moody is rgba(...,0.4)) and the map would read straight through the
                  // scrubber, making the track and labels illegible.
                  backgroundColor: 'rgba(var(--background-rgb), 0.95)',
                  borderColor: 'var(--border)',
                  boxShadow: '0 2px 12px var(--shadow)',
                  pointerEvents: 'auto',
                }}
              >
                <TimeSlider
                  minDate={minDate}
                  maxDate={maxDate}
                  currentDate={currentDate}
                  onChange={setCurrentDate}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intro Overlay - Slides to the left, but leaves sidebar visible */}
      <div
        className={`fixed md:absolute top-0 left-0 md:left-12 right-0 bottom-0 backdrop-blur-sm transition-transform duration-700 ease-in-out overflow-hidden ${
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
                router.push(queryString ? `/?${queryString}` : '/', { scroll: false })
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

export default function HomePage() {
  return <MapPage />
}
