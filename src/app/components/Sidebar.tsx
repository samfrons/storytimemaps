'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../../components/auth/LoginModal';
import SignupModal from '../../components/auth/SignupModal';
import ShareModal from './ShareModal';

interface SidebarProps {
  viewMode?: 'stories' | 'database';
  setViewMode?: (mode: 'stories' | 'database') => void;
  showIntro?: boolean;
  setShowIntro?: (show: boolean) => void;
  setIntroExplicitlyClosed?: (closed: boolean) => void;
  showInfo?: boolean;
  setShowInfo?: (show: boolean) => void;
}

export default function Sidebar({
  viewMode,
  setViewMode,
  showIntro,
  setShowIntro,
  setIntroExplicitlyClosed,
  showInfo,
  setShowInfo
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const { language, switchToLanguage } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMainPage = pathname === '/';
  const isBarchartsPage = pathname === '/barcharts';

  const handleThemeSwitch = (newTheme: string) => {
    // Set the theme
    setTheme(newTheme);
    setShowThemeMenu(false);
    
    // Update URL for sharing (after theme is set)
    const params = new URLSearchParams(searchParams.toString());
    params.set('theme', newTheme);
    const queryString = params.toString();
    router.replace(pathname + (queryString ? `?${queryString}` : ''), { scroll: false });
  };

  const goHome = () => {
    if (!isMainPage) {
      router.push('/');
    } else if (setShowIntro && setIntroExplicitlyClosed) {
      setShowIntro(true);
      setIntroExplicitlyClosed(false);
      if (setShowInfo) setShowInfo(false);
    }
  };

  const toggleInfo = () => {
    if (!isMainPage) {
      router.push('/?about=true');
    } else if (setShowInfo && setShowIntro && setIntroExplicitlyClosed) {
      setShowInfo(!showInfo);
      if (!showInfo) {
        setShowIntro(false);
        setIntroExplicitlyClosed(true);
      }
    }
  };

  const handleLanguageSwitch = (lang: 'en' | 'de' | 'yi') => {
    if (language !== lang) {
      switchToLanguage(lang);
      const params = new URLSearchParams(searchParams.toString());
      params.set('lang', lang);
      const queryString = params.toString();
      router.push(pathname + (queryString ? `?${queryString}` : ''), { scroll: false });
    }
  };

  return (
    <div 
      className="fixed left-4 top-20 flex flex-col gap-2 z-50 transition-all"
      style={{ zIndex: 9999 }}
    >
      {/* Theme Switcher Button */}
      <div className="relative">
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
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
          aria-label="Switch Theme"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Theme Dropdown */}
        {showThemeMenu && mounted && (
          <div 
            className="absolute left-12 top-0 w-32 border backdrop-blur-md shadow-lg" 
            style={{ 
              backgroundColor: 'var(--dropdown-bg)', 
              borderColor: 'var(--border)',
              zIndex: 10000
            }}
          >
            {['moody', 'hot', 'cold', 'warm', 'cool', 'bauhaus', 'art-nouveau', 'archival'].map((themeName) => (
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
              >
                {themeName === 'art-nouveau' ? 'Art Nouveau' : themeName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stories Mode Button - Only on main page */}
      {isMainPage && setViewMode && (
        <button
          onClick={() => {
            setViewMode('stories');
            if (showIntro && setShowIntro && setIntroExplicitlyClosed) {
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
            transition: 'transform 0.2s ease-in-out, background-color 0.2s'
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
      )}
      
      {/* Database Mode Button - Only on main page */}
      {isMainPage && setViewMode && (
        <button
          onClick={() => {
            setViewMode('database');
            if (showIntro && setShowIntro && setIntroExplicitlyClosed) {
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
            transition: 'transform 0.2s ease-in-out, background-color 0.2s'
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
      )}
      
      {/* Home/Map Button */}
      <button
        onClick={goHome}
        className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${(isMainPage && showIntro) ? 'hot-button-active' : ''}`}
        style={{
          backgroundColor: (isMainPage && showIntro) ? 'var(--primary)' : 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: (isMainPage && showIntro) ? 'var(--background)' : 'var(--foreground)',
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
        aria-label={isMainPage ? "Home" : "Back to Map"}
        title={isMainPage ? "Home" : "Back to Map"}
      >
        {isMainPage ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )}
      </button>

      {/* Info Button */}
      <button
        onClick={toggleInfo}
        className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${(isMainPage && showInfo) ? 'hot-button-active' : ''}`}
        style={{
          backgroundColor: (isMainPage && showInfo) ? 'var(--primary)' : 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: (isMainPage && showInfo) ? 'var(--background)' : 'var(--foreground)',
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
        className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110 ${isBarchartsPage ? 'hot-button-active' : ''}`}
        style={{
          backgroundColor: isBarchartsPage ? 'var(--primary)' : 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: isBarchartsPage ? 'var(--background)' : 'var(--foreground)',
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

      {/* Share Button */}
      <button
        onClick={() => setShowShareModal(true)}
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
        aria-label="Share"
        title="Share this project"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>

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
          className={`w-10 h-10 flex items-center justify-center transition-all duration-200 border hover:scale-110 text-xs font-mono ${
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

      {/* Auth Button - Only show if not logged in */}
      {mounted && !user && (
        <button
          onClick={() => setShowLoginModal(true)}
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
          aria-label="Login / Sign Up"
          title="Login to propose changes"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      )}

      {/* User Profile Button - Only show if logged in */}
      {mounted && user && (
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 flex items-center justify-center transition-all duration-200 border hot-button hover:scale-110"
          style={{
            backgroundColor: 'var(--primary)',
            borderColor: 'var(--border)',
            color: 'var(--background)',
            cursor: 'pointer',
            transform: 'scale(1)',
            transition: 'transform 0.2s ease-in-out, background-color 0.2s',
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="User Dashboard"
          title="My Dashboard"
        >
          {user.email?.[0].toUpperCase() || 'U'}
        </button>
      )}

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}