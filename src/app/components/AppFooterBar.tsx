'use client'

import React from 'react'
import Link from 'next/link'
import SiteCopyright from './SiteCopyright'

/**
 * The footer for the full-screen surfaces — the maps, the data browser.
 *
 * Those pages lock the viewport (`h-screen overflow-hidden`) and fill it with
 * an absolutely-positioned map, so the document footer used elsewhere has
 * nowhere to sit: there is no scroll to reach it. This is the same footer
 * content compressed into a single pinned strip instead.
 *
 * Hidden below `md`: on a phone these pages already anchor the drawer tab and
 * the time slider to the bottom edge, and the strip would land underneath them.
 */

const LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/plaques', label: 'Plaques' },
  { href: '/education', label: 'Teachers' },
  { href: '/collaborate', label: 'Collaborate' },
]

interface AppFooterBarProps {
  /**
   * Render in normal flow instead of pinned over the content. Use on the
   * pages whose root is already a flex column with a scrolling body — there
   * the strip is a real last row, so it cannot cover the final list item.
   */
  inFlow?: boolean
}

const AppFooterBar: React.FC<AppFooterBarProps> = ({ inFlow = false }) => (
  <footer
    className={`hidden md:flex items-center gap-x-6 gap-y-1 flex-wrap px-4 py-1.5 border-t ${
      inFlow ? 'flex-shrink-0' : 'absolute bottom-0 left-0 right-0 z-10'
    }`}
    style={{
      backgroundColor: 'var(--background)',
      borderColor: 'var(--border)',
    }}
  >
    {LINKS.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        className="font-mono text-[10px] uppercase tracking-widest transition-opacity hover:opacity-80"
        style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
      >
        {label}
      </Link>
    ))}
    <span
      className="font-mono text-[10px] uppercase tracking-widest"
      style={{ color: 'var(--foreground-muted)' }}
    >
      StoryMaps · Berlin 1900–1945
    </span>
    <SiteCopyright className="font-mono text-[10px] tracking-widest ml-auto" />
  </footer>
)

export default React.memo(AppFooterBar)
