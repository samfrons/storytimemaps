'use client'

import React from 'react'

interface SiteCreditProps {
  /** Extra classes for the wrapper, so each footer can set its own spacing. */
  className?: string
}

/**
 * Authorship credit for the site.
 *
 * Its own component because several separate footers carry it — HomeFooter (/,
 * /plaques, /exhibit-vision), GuideShell (/onboarding and its guides) and
 * /collaborate — and a credit line copied that many times is a credit line that
 * drifts. Not translated: a name and a © are the same in every locale.
 */
const SiteCredit: React.FC<SiteCreditProps> = ({ className = '' }) => (
  <a
    href="https://samfrons.xyz"
    target="_blank"
    rel="noreferrer noopener"
    className={`font-mono text-xs transition-opacity hover:opacity-70 ${className}`}
    style={{ color: 'var(--muted)', outline: 'none', boxShadow: 'none' }}
  >
    © Sam Frons
  </a>
)

/**
 * A minimal footer bar carrying nothing but the credit.
 *
 * For scrolling content pages that had no footer of their own to add the credit
 * to — the /education hub and its two document pages. Pages built as a
 * fixed-height app shell (the map, the kiosk, the record table, the dashboards)
 * are deliberately not given one: they have no scroll-end for a footer to sit
 * at, and a bar there would eat into the viewport the shell is sized against.
 */
export const CreditFooter: React.FC = () => (
  <footer
    className="border-t px-5 sm:px-8 py-6"
    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
  >
    <div className="max-w-6xl mx-auto">
      <SiteCredit />
    </div>
  </footer>
)

export default React.memo(SiteCredit)
