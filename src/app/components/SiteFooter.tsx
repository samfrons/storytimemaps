'use client'

import React from 'react'

/**
 * The site-wide copyright notice.
 *
 * Every page carries it — the long-form footers embed <CopyrightLine /> under
 * their own content, pages that had no footer at all get <SiteFooter />, and
 * the full-viewport map pages, which have no space in the flow, get
 * <OverlayCopyright /> tucked into a corner.
 *
 * Single source of truth: change the year or the credit here, nowhere else.
 */
export const COPYRIGHT_YEAR = '2026'
export const COPYRIGHT_HOLDER = 'StoryTimeMaps'
export const CREDIT_URL = 'https://samfrons.xyz'
export const CREDIT_LABEL = 'samfrons.xyz'

interface CopyrightLineProps {
  className?: string
  style?: React.CSSProperties
}

/**
 * The notice itself, without any chrome, so it can sit inside a footer that
 * already exists without inheriting a second border or background.
 */
export const CopyrightLine: React.FC<CopyrightLineProps> = ({ className = '', style }) => (
  <p
    className={`font-mono text-xs tracking-wide ${className}`}
    style={{ color: 'var(--muted)', ...style }}
  >
    <span>
      © {COPYRIGHT_YEAR} {COPYRIGHT_HOLDER}
    </span>
    <span aria-hidden="true"> · </span>
    {/* pointerEvents matters only inside <OverlayCopyright />, where the
        surrounding footer is click-through so the map stays draggable. */}
    <a
      href={CREDIT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="transition-opacity hover:opacity-80"
      style={{ color: 'inherit', outline: 'none', boxShadow: 'none', pointerEvents: 'auto' }}
    >
      {CREDIT_LABEL}
    </a>
  </p>
)

interface SiteFooterProps {
  className?: string
}

/**
 * The standalone footer for pages that carry their content in normal flow.
 */
const SiteFooter: React.FC<SiteFooterProps> = ({ className = '' }) => (
  <footer
    className={`border-t px-5 sm:px-8 py-6 ${className}`}
    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
  >
    <div className="max-w-6xl mx-auto">
      <CopyrightLine />
    </div>
  </footer>
)

interface OverlayCopyrightProps extends CopyrightLineProps {
  /** Overrides for the notice itself, for pages that do not run on the theme palette. */
  textStyle?: React.CSSProperties
}

/**
 * The corner notice for the full-viewport map pages. Those layouts are
 * `h-screen overflow-hidden`, so a footer in the flow would never be reached;
 * it sits over the map instead.
 *
 * Bottom right, lifted clear of Mapbox's attribution strip — the left corner
 * belongs to the Mapbox logo and, on these pages, to the icon rail and the
 * story list. z-index 700 keeps it under every piece of map chrome (the
 * scrubber is 900, the panels 800+), so where they meet the controls win and
 * the notice hides rather than the other way round. It is click-through
 * except on the link itself, so the map stays draggable underneath.
 */
export const OverlayCopyright: React.FC<OverlayCopyrightProps> = ({
  className = '',
  style,
  textStyle,
}) => (
  <footer
    className={`fixed md:absolute ${className}`}
    style={{
      zIndex: 700,
      right: 0,
      bottom: 'calc(26px + env(safe-area-inset-bottom, 0px))',
      paddingLeft: '0.5rem',
      paddingRight: 'calc(0.5rem + env(safe-area-inset-right, 0px))',
      paddingTop: '0.15rem',
      paddingBottom: '0.15rem',
      backgroundColor: 'rgba(var(--background-rgb), 0.85)',
      pointerEvents: 'none',
      ...style,
    }}
  >
    <CopyrightLine className="text-[10px]" style={textStyle} />
  </footer>
)

export default React.memo(SiteFooter)
