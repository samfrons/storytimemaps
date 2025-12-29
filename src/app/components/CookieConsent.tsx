'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from '../../i18n/useTranslation'

interface CookieConsentProps {
  onAccept?: () => void
  onDecline?: () => void
  onSettings?: () => void
}

const COOKIE_CONSENT_KEY = 'storymap-cookie-consent'

type ConsentValue = 'accepted' | 'declined' | null

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline, onSettings }) => {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(true)
  const [marketingConsent, setMarketingConsent] = useState(false)

  // Check if consent was already given
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentValue
      if (!consent) {
        // Small delay before showing to prevent flash on page load
        const timer = setTimeout(() => {
          setIsAnimating(true)
          setIsVisible(true)
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleClose = useCallback((consentType: 'accepted' | 'declined') => {
    setIsAnimating(false)
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem(COOKIE_CONSENT_KEY, consentType)
      }
    }, 300)
  }, [])

  const handleAcceptAll = useCallback(() => {
    handleClose('accepted')
    onAccept?.()
  }, [handleClose, onAccept])

  const handleDecline = useCallback(() => {
    handleClose('declined')
    onDecline?.()
  }, [handleClose, onDecline])

  const handleSaveSettings = useCallback(() => {
    // Save with specific consent preferences
    const consentData = {
      essential: true, // Always required
      analytics: analyticsConsent,
      marketing: marketingConsent,
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
      localStorage.setItem('storymap-cookie-preferences', JSON.stringify(consentData))
    }
    handleClose('accepted')
    onAccept?.()
  }, [analyticsConsent, marketingConsent, handleClose, onAccept])

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true)
    onSettings?.()
  }, [onSettings])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[9998] transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={() => {}} // Prevent clicks from passing through
      />

      {/* Cookie consent banner */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
      >
        <div
          className="w-full border-t"
          style={{
            backgroundColor: 'var(--background)',
            borderTopColor: 'var(--border)',
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {!showSettings ? (
              // Main consent view
              <>
                <h2
                  id="cookie-consent-title"
                  className="font-mono text-xl md:text-2xl font-bold mb-4"
                  style={{ color: 'var(--foreground)' }}
                >
                  {t('cookieConsent.title', {
                    defaultValue: 'We use cookies and other technologies.',
                  })}
                </h2>

                <p
                  className="font-sans text-sm md:text-base mb-6 leading-relaxed"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {t('cookieConsent.description', {
                    defaultValue:
                      "This site uses third-party website tracking technologies to provide and continuously improve its services and to display advertisements according to users' interests. I agree to this and can revoke or change my consent at any time with effect for the future.",
                  })}
                </p>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <button
                    onClick={handleOpenSettings}
                    className="font-mono text-xs md:text-sm font-semibold py-3 px-5 uppercase tracking-wider transition-all duration-200"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground)'
                    }}
                  >
                    {t('cookieConsent.settings', { defaultValue: 'SETTINGS' })}
                  </button>

                  <button
                    onClick={handleDecline}
                    className="font-mono text-xs md:text-sm font-semibold py-3 px-5 uppercase tracking-wider transition-all duration-200"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground)'
                    }}
                  >
                    {t('cookieConsent.decline', { defaultValue: 'DECLINE' })}
                  </button>

                  <button
                    onClick={handleAcceptAll}
                    className="font-mono text-xs md:text-sm font-semibold py-3 px-6 uppercase tracking-wider transition-all duration-200 border-2"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--foreground)',
                      borderColor: 'var(--foreground)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--foreground)'
                      e.currentTarget.style.color = 'var(--background)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                      e.currentTarget.style.color = 'var(--foreground)'
                    }}
                  >
                    {t('cookieConsent.acceptAll', { defaultValue: 'ACCEPT ALL' })}
                  </button>
                </div>

                {/* Footer links */}
                <div
                  className="flex items-center gap-2 text-xs md:text-sm font-mono uppercase tracking-wide"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  <Link
                    href="/imprint"
                    className="transition-colors duration-200 hover:underline"
                    style={{ color: 'var(--foreground-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground-muted)'
                    }}
                  >
                    {t('cookieConsent.imprint', { defaultValue: 'IMPRINT' })}
                  </Link>
                  <span style={{ color: 'var(--border)' }}>|</span>
                  <Link
                    href="/privacy"
                    className="transition-colors duration-200 hover:underline"
                    style={{ color: 'var(--foreground-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground-muted)'
                    }}
                  >
                    {t('cookieConsent.privacyPolicy', { defaultValue: 'PRIVACY POLICY' })}
                  </Link>
                </div>
              </>
            ) : (
              // Settings view
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="font-mono text-xl md:text-2xl font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {t('cookieConsent.settingsTitle', { defaultValue: 'Cookie Settings' })}
                  </h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 transition-colors duration-200"
                    style={{ color: 'var(--foreground-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--foreground)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground-muted)'
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Essential cookies - always on */}
                  <div
                    className="flex items-center justify-between p-4 border"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'rgba(var(--muted-rgb), 0.2)',
                    }}
                  >
                    <div>
                      <h3
                        className="font-mono text-sm font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {t('cookieConsent.essential', { defaultValue: 'Essential Cookies' })}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                        {t('cookieConsent.essentialDesc', {
                          defaultValue: 'Required for the website to function. Cannot be disabled.',
                        })}
                      </p>
                    </div>
                    <div
                      className="font-mono text-xs uppercase tracking-wide px-3 py-1"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--background)',
                      }}
                    >
                      {t('cookieConsent.alwaysOn', { defaultValue: 'Always On' })}
                    </div>
                  </div>

                  {/* Analytics cookies */}
                  <div
                    className="flex items-center justify-between p-4 border"
                    style={{
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div>
                      <h3
                        className="font-mono text-sm font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {t('cookieConsent.analytics', { defaultValue: 'Analytics Cookies' })}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                        {t('cookieConsent.analyticsDesc', {
                          defaultValue:
                            'Help us understand how visitors interact with our website.',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setAnalyticsConsent(!analyticsConsent)}
                      className={`relative w-12 h-6 transition-colors duration-200 ${
                        analyticsConsent ? '' : 'opacity-50'
                      }`}
                      style={{
                        backgroundColor: analyticsConsent ? 'var(--primary)' : 'var(--muted)',
                      }}
                      aria-checked={analyticsConsent}
                      role="switch"
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 transition-transform duration-200 ${
                          analyticsConsent ? 'translate-x-7' : 'translate-x-1'
                        }`}
                        style={{ backgroundColor: 'var(--background)' }}
                      />
                    </button>
                  </div>

                  {/* Marketing cookies */}
                  <div
                    className="flex items-center justify-between p-4 border"
                    style={{
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div>
                      <h3
                        className="font-mono text-sm font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {t('cookieConsent.marketing', { defaultValue: 'Marketing Cookies' })}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--foreground-muted)' }}>
                        {t('cookieConsent.marketingDesc', {
                          defaultValue:
                            'Used to track visitors across websites for advertising purposes.',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setMarketingConsent(!marketingConsent)}
                      className={`relative w-12 h-6 transition-colors duration-200 ${
                        marketingConsent ? '' : 'opacity-50'
                      }`}
                      style={{
                        backgroundColor: marketingConsent ? 'var(--primary)' : 'var(--muted)',
                      }}
                      aria-checked={marketingConsent}
                      role="switch"
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 transition-transform duration-200 ${
                          marketingConsent ? 'translate-x-7' : 'translate-x-1'
                        }`}
                        style={{ backgroundColor: 'var(--background)' }}
                      />
                    </button>
                  </div>
                </div>

                {/* Save settings button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="font-mono text-xs md:text-sm font-semibold py-3 px-5 uppercase tracking-wider transition-all duration-200"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--foreground)'
                    }}
                  >
                    {t('cookieConsent.back', { defaultValue: 'BACK' })}
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="font-mono text-xs md:text-sm font-semibold py-3 px-6 uppercase tracking-wider transition-all duration-200 border-2"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--foreground)',
                      borderColor: 'var(--foreground)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--foreground)'
                      e.currentTarget.style.color = 'var(--background)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)'
                      e.currentTarget.style.color = 'var(--foreground)'
                    }}
                  >
                    {t('cookieConsent.saveSettings', { defaultValue: 'SAVE SETTINGS' })}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default React.memo(CookieConsent)
