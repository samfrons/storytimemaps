'use client'

import React, { memo, useCallback } from 'react'
import Link from 'next/link'

type SupportedLanguage = 'en' | 'de' | 'yi'

interface NavigationSidebarProps {
  viewMode: 'stories' | 'database'
  setViewMode: (mode: 'stories' | 'database') => void
  showThemeMenu: boolean
  setShowThemeMenu: (show: boolean) => void
  theme: string | undefined
  mounted: boolean
  onThemeSwitch: (theme: string) => void
  goHome: () => void
  showInfo: boolean
  toggleInfo: () => void
  language: string
  switchToLanguage: (lang: SupportedLanguage) => void
  /** Optional: pages that offer the two map layouts pass these to show the layout toggle. */
  layoutMode?: 'split' | 'drawer'
  onLayoutSwitch?: (layout: 'split' | 'drawer') => void
  onLanguageChange: (lang: string) => void
  showMobileMenu: boolean
  setShowMobileMenu: (show: boolean) => void
}

const THEMES = [
  'moody',
  'hot',
  'cold',
  'warm',
  'cool',
  'bauhaus',
  'art-nouveau',
  'archival',
  'hoefe',
  'brutal-pop',
]

const NavigationSidebar: React.FC<NavigationSidebarProps> = memo(
  ({
    viewMode,
    setViewMode,
    showThemeMenu,
    setShowThemeMenu,
    theme,
    mounted,
    onThemeSwitch,
    goHome,
    showInfo,
    toggleInfo,
    language,
    switchToLanguage,
    onLanguageChange,
    showMobileMenu,
    setShowMobileMenu,
    layoutMode = 'split',
    onLayoutSwitch,
  }) => {
    const handleViewModeChange = useCallback(
      (mode: 'stories' | 'database') => {
        setViewMode(mode)
      },
      [setViewMode]
    )

    const handleLanguageSwitch = useCallback(
      (lang: SupportedLanguage) => {
        if (language !== lang) {
          switchToLanguage(lang)
          onLanguageChange(lang)
        }
      },
      [language, switchToLanguage, onLanguageChange]
    )

    const getThemeDisplayName = (themeName: string) => {
      const displayNames: Record<string, string> = {
        'art-nouveau': 'Art Nouveau',
        'brutal-pop': 'Brutal Pop',
      }
      return displayNames[themeName] ?? themeName
    }

    return (
      <>
        {/* Desktop Sidebar Navigation */}
        <div
          className="hidden md:flex md:w-12 md:h-full flex-shrink-0 flex-col items-center py-6 gap-4 absolute left-0 top-0 hot-sidebar"
          style={{
            zIndex: 10000,
            // The rail used to be a 64px opaque column with a backdrop blur - a solid wall down
            // the side of a map whose whole point is seeing thousands of pins at once. It is now
            // 48px and transparent, so the map reads continuously behind the icon gaps; each
            // button carries its own surface (see the button styles below).
            backgroundColor: 'transparent',
            marginTop: '0',
          }}
        >
          {/* Theme Button */}
          <button
            onClick={() => handleLanguageSwitch('de')}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hover:scale-110 text-xs font-mono ${
              language === 'de' ? 'lang-btn-active' : 'lang-btn'
            }`}
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
              transition: 'transform 0.2s ease-in-out',
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
              {THEMES.map((themeName) => (
                <button
                  key={themeName}
                  onClick={() => onThemeSwitch(themeName)}
                  className={`w-full px-3 py-2 text-left text-xs font-mono transition-all capitalize ${mounted && theme === themeName ? 'dropdown-active' : ''}`}
                  style={{
                    backgroundColor:
                      mounted && theme === themeName ? 'var(--primary)' : 'transparent',
                    color:
                      mounted && theme === themeName ? 'var(--background)' : 'var(--foreground)',
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
                  {getThemeDisplayName(themeName)}
                </button>
              ))}
            </div>
          )}

          {/* Layout Button - switches between the split column and the map-first drawer */}
          {onLayoutSwitch && (
            <button
              onClick={() => onLayoutSwitch(layoutMode === 'drawer' ? 'split' : 'drawer')}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${layoutMode === 'drawer' ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: layoutMode === 'drawer' ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: layoutMode === 'drawer' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label={
                layoutMode === 'drawer' ? 'Switch to split layout' : 'Switch to full-width map'
              }
              aria-pressed={layoutMode === 'drawer'}
              title={
                layoutMode === 'drawer'
                  ? 'Split layout: list beside the map'
                  : 'Full-width map: list collapses to a tab'
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {/* Panel-and-canvas glyph: a bordered frame with a divider that reads as the
                    list column. Filled when the drawer layout is active. */}
                <rect x="3" y="4" width="18" height="16" strokeWidth={2} />
                <line x1="9" y1="4" x2="9" y2="20" strokeWidth={2} />
              </svg>
            </button>
          )}

          {/* Stories Mode Button */}
          <button
            onClick={() => handleViewModeChange('stories')}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${viewMode === 'stories' ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: viewMode === 'stories' ? 'var(--success)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: viewMode === 'stories' ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
              transform: 'scale(1)',
              transition: 'transform 0.2s ease-in-out',
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </button>

          {/* Database Mode Button */}
          <button
            onClick={() => handleViewModeChange('database')}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${viewMode === 'database' ? 'hot-button-active' : ''}`}
            style={{
              backgroundColor: viewMode === 'database' ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: viewMode === 'database' ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer',
              transform: 'scale(1)',
              transition: 'transform 0.2s ease-in-out',
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          </button>

          {/* Home button — leaves the map for the site homepage. */}
          <button
            onClick={goHome}
            className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              transform: 'scale(1)',
              transition: 'transform 0.2s ease-in-out',
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
              transition: 'transform 0.2s ease-in-out',
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
              transition: 'transform 0.2s ease-in-out',
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

          {/* History Tour Button */}
          <Link
            href="/history-tour"
            className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              transform: 'scale(1)',
              transition: 'transform 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            aria-label="History Tour"
            title="History Tour — Fifteen Addresses"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </Link>

          {/* Language Toggle Buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleLanguageSwitch('en')}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hover:scale-110 text-xs font-mono ${
                language === 'en' ? 'lang-btn-active' : 'lang-btn'
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageSwitch('de')}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer text-xs font-mono ${
                language === 'de' ? 'lang-btn-active' : 'lang-btn'
              }`}
              aria-label="Switch to German"
            >
              DE
            </button>
            <button
              onClick={() => handleLanguageSwitch('yi')}
              className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hover:scale-110 text-xs font-mono ${
                language === 'yi' ? 'lang-btn-active' : 'lang-btn'
              }`}
              aria-label="Switch to Yiddish"
              title="ייִדיש (Yiddish)"
            >
              YI
            </button>
          </div>
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
              onClick={() => setShowThemeMenu(!showThemeMenu)}
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

            {/* Stories Mode Button */}
            <button
              onClick={() => {
                handleViewModeChange('stories')
                setShowMobileMenu(false)
              }}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${viewMode === 'stories' ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: viewMode === 'stories' ? 'var(--success)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: viewMode === 'stories' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'Space Mono, monospace',
                fontWeight: '600',
              }}
              aria-label="Featured Stories mode"
              title="Featured Stories (15 detailed narratives)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </button>

            {/* Database Mode Button */}
            <button
              onClick={() => {
                handleViewModeChange('database')
                setShowMobileMenu(false)
              }}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer hot-button ${viewMode === 'database' ? 'hot-button-active' : ''}`}
              style={{
                backgroundColor: viewMode === 'database' ? 'var(--primary)' : 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: viewMode === 'database' ? 'var(--background)' : 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'Space Mono, monospace',
                fontWeight: '600',
              }}
              aria-label="Historical Database mode"
              title="Historical Database (10,000+ records)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
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
              onClick={() => handleLanguageSwitch('en')}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer text-xs font-mono ${
                language === 'en' ? 'lang-btn-active' : 'lang-btn'
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageSwitch('yi')}
              className={`w-12 h-12 flex items-center justify-center transition-all duration-200 border hover:opacity-80 cursor-pointer text-xs font-mono ${
                language === 'yi' ? 'lang-btn-active' : 'lang-btn'
              }`}
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
            {THEMES.map((themeName) => (
              <button
                key={themeName}
                onClick={() => {
                  onThemeSwitch(themeName)
                  setShowMobileMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-xs font-mono transition-all capitalize"
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
                {getThemeDisplayName(themeName)}
              </button>
            ))}
          </div>
        )}
      </>
    )
  }
)

NavigationSidebar.displayName = 'NavigationSidebar'

export default NavigationSidebar
