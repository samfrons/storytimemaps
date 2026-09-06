'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import type { GeoJSONFeatureCollection, GeoJSONFeature } from '../../types'
import { useTheme } from 'next-themes'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { useIsMounted } from '../../hooks/useIsMounted'
import { useTranslation } from '../../i18n/useTranslation'

// Frankfurt coordinates
const frankfurtCoordinates = {
  lat: 50.1109,
  lng: 8.6821,
}

const defaultZoom = 12

const MapboxMap = dynamic(() => import('../components/MapboxMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="font-mono" style={{ color: 'var(--primary)' }}>
        Loading Frankfurt map...
      </div>
    </div>
  ),
})

function FrankfurtMapContent() {
  const { t, language, switchToLanguage } = useTranslation()
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showInfo, setShowInfo] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [businessData, setBusinessData] = useState<GeoJSONFeatureCollection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState<GeoJSONFeature | null>(null)
  const [selectedDate] = useState(new Date('1935-01-01'))

  // Load Frankfurt business data
  useEffect(() => {
    const loadFrankfurtData = async () => {
      try {
        // Try loading complete dataset first, fallback to original if not available
        const response = await fetch('/frankfurt_businesses_complete.geojson').catch(() =>
          fetch('/frankfurt_businesses.geojson')
        )
        const data = await response.json()
        setBusinessData(data)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading Frankfurt data:', error)
        setIsLoading(false)
      }
    }

    loadFrankfurtData()
  }, [])

  // Force theme from URL
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
      setTimeout(() => {
        setTheme(themeParam)
      }, 50)
    }
  }, [mounted, searchParams, setTheme])

  const handleBusinessSelect = useCallback((business: GeoJSONFeature) => {
    setSelectedBusiness(business)
  }, [])

  const handleThemeSwitch = useCallback(
    (newTheme: string) => {
      if (!mounted || theme === newTheme) return

      setShowThemeMenu(false)
      setTheme(newTheme)

      // Update URL parameter for sharing
      const params = new URLSearchParams(searchParams.toString())
      params.set('theme', newTheme)
      const queryString = params.toString()
      router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', { scroll: false })
    },
    [mounted, theme, setTheme, searchParams, router]
  )

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
    router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', { scroll: false })
  }, [showInfo, searchParams, router])

  const goHome = useCallback(() => {
    const params = new URLSearchParams()
    if (language) {
      params.set('lang', language)
    }
    const queryString = params.toString()
    router.push(queryString ? `/?${queryString}` : '/', { scroll: false })
  }, [router, language])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Visually hidden — the map fills the viewport with no room for a
          heading, but the page still needs exactly one h1 for a11y/SEO. */}
      <h1 className="sr-only">Jewish Businesses in Frankfurt, 1900-1945</h1>

      {/* Desktop Sidebar Navigation - Same as main page */}
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
          onClick={() => {
            if (language !== 'de') {
              switchToLanguage('de')
              const params = new URLSearchParams(searchParams.toString())
              params.set('lang', 'de')
              const queryString = params.toString()
              router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', {
                scroll: false,
              })
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
              >
                {themeName === 'art-nouveau' ? 'Art Nouveau' : themeName}
              </button>
            ))}
          </div>
        )}

        {/* Home Button */}
        <button
          onClick={goHome}
          className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
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
            fontSize: '18px',
            fontFamily: 'serif',
            fontStyle: 'italic',
            fontWeight: '600',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Information"
        >
          i
        </button>

        {/* Bar Charts Button */}
        <Link
          href="/barcharts"
          className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
          style={{
            backgroundColor: 'var(--input-bg)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
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
          aria-label="Data Visualizations"
          title="Interactive Bar Charts"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </Link>

        {/* Language Toggle Buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              if (language !== 'en') {
                switchToLanguage('en')
                const params = new URLSearchParams(searchParams.toString())
                params.set('lang', 'en')
                const queryString = params.toString()
                router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', {
                  scroll: false,
                })
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
                switchToLanguage('de')
                const params = new URLSearchParams(searchParams.toString())
                params.set('lang', 'de')
                const queryString = params.toString()
                router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', {
                  scroll: false,
                })
              }
            }}
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button"
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
          <button
            onClick={() => {
              if (language !== 'yi') {
                switchToLanguage('yi')
                const params = new URLSearchParams(searchParams.toString())
                params.set('lang', 'yi')
                const queryString = params.toString()
                router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', {
                  scroll: false,
                })
              }
            }}
            className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
            style={{
              backgroundColor: language === 'yi' ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: language === 'yi' ? 'var(--background)' : 'var(--foreground)',
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
            aria-label="Switch to Yiddish"
            title="ייִדיש (Yiddish)"
          >
            YI
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col md:flex-row h-screen md:pl-16">
        {/* Map Container */}
        <div className="flex-1 relative">
          {businessData && (
            <MapboxMap
              center={frankfurtCoordinates}
              zoom={defaultZoom}
              data={businessData}
              selectedDate={selectedDate}
              onBusinessSelect={handleBusinessSelect}
              city="frankfurt"
            />
          )}

          {/* Time Slider */}
          <div
            className="absolute bottom-4 left-4 right-4 px-4 py-3 rounded"
            style={{ backgroundColor: 'rgba(var(--card-bg-rgb), 0.95)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
                {t('timeline.year')}: 1935
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--foreground-muted)' }}>
                {t('timeline.snapshot')}
              </span>
            </div>
            <div className="text-xs font-mono mt-2" style={{ color: 'var(--foreground-muted)' }}>
              {businessData?.features?.length || 0} {t('businesses.total')}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {selectedBusiness && (
          <div
            className="w-80 border-l overflow-y-auto"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--background)',
            }}
          >
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold font-mono" style={{ color: 'var(--primary)' }}>
                  {(selectedBusiness.properties.name as string) || 'Unknown'}
                </h2>
                <button
                  onClick={() => setSelectedBusiness(null)}
                  className="text-sm font-mono px-2 py-1 rounded hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--muted)',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p
                    className="text-xs font-mono mb-1"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {t('business.owner')}
                  </p>
                  <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                    {(selectedBusiness.properties.owner as string) || 'Unknown'}
                  </p>
                </div>

                <div>
                  <p
                    className="text-xs font-mono mb-1"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {t('business.address')}
                  </p>
                  <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                    {(selectedBusiness.properties.address as string) || 'Unknown'}
                  </p>
                </div>

                <div>
                  <p
                    className="text-xs font-mono mb-1"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {t('business.district')}
                  </p>
                  <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                    {(selectedBusiness.properties.district as string) || 'Unknown'}
                  </p>
                </div>

                <div>
                  <p
                    className="text-xs font-mono mb-1"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {t('business.category')}
                  </p>
                  <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                    {(selectedBusiness.properties.category as string) || 'Unknown'}
                  </p>
                </div>

                {(selectedBusiness.properties.subcategory as string) && (
                  <div>
                    <p
                      className="text-xs font-mono mb-1"
                      style={{ color: 'var(--foreground-muted)' }}
                    >
                      {t('business.subcategory')}
                    </p>
                    <p className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                      {selectedBusiness.properties.subcategory as string}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
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
              fontSize: '20px',
              fontFamily: 'serif',
              fontStyle: 'italic',
              fontWeight: '600',
            }}
            aria-label="Information"
          >
            i
          </button>

          {/* Bar Charts Button for Mobile */}
          <Link
            href="/barcharts"
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
            aria-label="Data Visualizations"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </Link>

          {/* Language Buttons for Mobile */}
          <button
            onClick={() => {
              if (language !== 'en') {
                switchToLanguage('en')
                const params = new URLSearchParams(searchParams.toString())
                params.set('lang', 'en')
                const queryString = params.toString()
                router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', {
                  scroll: false,
                })
              }
            }}
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button"
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
              if (language !== 'yi') {
                switchToLanguage('yi')
                const params = new URLSearchParams(searchParams.toString())
                params.set('lang', 'yi')
                const queryString = params.toString()
                router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', {
                  scroll: false,
                })
              }
            }}
            className="w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button"
            style={{
              backgroundColor: language === 'yi' ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: language === 'yi' ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'Space Mono, monospace',
            }}
            aria-label="Switch to Yiddish"
            title="ייִדיש (Yiddish)"
          >
            YI
          </button>
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
            >
              {themeName === 'art-nouveau' ? 'Art Nouveau' : themeName}
            </button>
          ))}
        </div>
      )}

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
        <div className="relative h-full overflow-y-auto">
          <div className="p-8">
            {/* Close button */}
            <button
              onClick={() => {
                setShowInfo(false)
                const params = new URLSearchParams(searchParams.toString())
                params.delete('about')
                const queryString = params.toString()
                router.push(queryString ? `/frankfurt?${queryString}` : '/frankfurt', {
                  scroll: false,
                })
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
                  Frankfurt am Main 1935
                </h2>
                <div className="w-20 h-1" style={{ backgroundColor: 'var(--primary)' }} />
              </div>

              <div
                className="space-y-6 font-['Space_Mono'] font-mono"
                style={{ color: 'var(--foreground)' }}
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    Historical Context
                  </h3>
                  <p className="leading-relaxed">
                    This map displays Jewish-owned businesses in Frankfurt am Main as documented in
                    the 1935 directory, capturing the commercial landscape just before the
                    implementation of the Nuremberg Laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    The Data
                  </h3>
                  <p className="leading-relaxed">
                    The dataset includes {businessData?.features?.length || 0} businesses across
                    various categories including textiles, banking, retail, and professional
                    services. Frankfurt&apos;s Jewish community had deep historical roots, with the
                    famous Judengasse being one of Europe&apos;s earliest Jewish quarters.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    Major Business Districts
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2" style={{ backgroundColor: 'var(--primary)' }} />
                      <span>Zeil - Main commercial street</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2" style={{ backgroundColor: 'var(--primary)' }} />
                      <span>Kaiserstraße - Banking district</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2" style={{ backgroundColor: 'var(--primary)' }} />
                      <span>Fahrgasse - Historic Jewish quarter</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-2 h-2" style={{ backgroundColor: 'var(--primary)' }} />
                      <span>Börsenplatz - Stock exchange area</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary)' }}>
                    Notable Families
                  </h3>
                  <p className="leading-relaxed">
                    The directory reveals established business dynasties including Rothschild,
                    Oppenheimer, Goldschmidt, and other families who had contributed to
                    Frankfurt&apos;s economic development for generations.
                  </p>
                </div>

                <div className="pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    Data extracted from the 1935 Frankfurt Jewish Business Directory. This
                    visualization serves as a memorial to the destroyed Jewish commercial life of
                    Frankfurt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FrankfurtMapPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <FrankfurtMapContent />
    </Suspense>
  )
}
