'use client'

import React from 'react'
import Link from 'next/link'
import { CopyrightLine } from '../components/SiteFooter'

// Brutal-pop building blocks: thick borders, hard offset shadows, sharp edges.
// All colors come from theme CSS variables per project rules.

const HARD_SHADOW = '8px 8px 0'
const BORDER_WIDTH = '3px'

interface TrackCard {
  tag: string
  title: string
  description: string
  accent: string
  href: string
  linkLabel: string
}

const TRACKS: TrackCard[] = [
  {
    tag: '01 / CODE',
    title: 'Build the Platform',
    description:
      'Next.js, TypeScript, Mapbox GL. Work on the interactive map, timeline, themes, and performance. Sharp edges only.',
    accent: 'var(--accent-chartreuse)',
    href: '/onboarding',
    linkLabel: 'Read the onboarding guide',
  },
  {
    tag: '02 / RESEARCH',
    title: 'Verify the History',
    description:
      'Confirm dates, addresses, and business histories against archival sources. Every record is the story of real people.',
    accent: 'var(--accent-yellow)',
    href: 'https://github.com/samfrons/storytimemaps/issues',
    linkLabel: 'Browse research tasks',
  },
  {
    tag: '03 / OUTREACH',
    title: 'Place the Plaques',
    description:
      'Contact current occupants of former business addresses about memorial plaques. Tracked address-by-address in our pipeline.',
    accent: 'var(--accent-coral)',
    href: '/admin/outreach',
    linkLabel: 'Open the outreach tracker',
  },
  {
    tag: '04 / TRANSLATE',
    title: 'Cross the Languages',
    description:
      'English, German, Yiddish, Hebrew. Help the stories reach the communities they belong to, RTL included.',
    accent: 'var(--accent-purple)',
    href: 'https://github.com/samfrons/storytimemaps/issues',
    linkLabel: 'See i18n tasks',
  },
]

const PIPELINE: { label: string; bg: string; fg: string }[] = [
  { label: 'NOT STARTED', bg: 'var(--muted)', fg: 'var(--foreground)' },
  { label: 'RESEARCHING', bg: 'var(--primary)', fg: 'var(--background)' },
  { label: 'CONTACTED', bg: 'var(--primary)', fg: 'var(--background)' },
  { label: 'AWAITING RESPONSE', bg: 'var(--warning)', fg: 'var(--declining-text)' },
  { label: 'FOLLOW-UP NEEDED', bg: 'var(--warning)', fg: 'var(--declining-text)' },
  { label: 'INTERESTED', bg: 'var(--success)', fg: 'var(--active-text)' },
  { label: 'APPROVED', bg: 'var(--success)', fg: 'var(--active-text)' },
]

const STEPS: { num: string; title: string; body: string }[] = [
  {
    num: '1',
    title: 'READ THE GUIDE',
    body: 'Start at /onboarding — mission, setup, ground rules, and which track fits you.',
  },
  {
    num: '2',
    title: 'CLAIM A TASK',
    body: 'Pick a GitHub issue (look for good-first-task) or an address in the outreach tracker. Comment to claim it.',
  },
  {
    num: '3',
    title: 'SHIP IT',
    body: 'Branch, build, test all themes, open a PR. Outreach work is logged directly in the tracker.',
  },
]

const blockStyle = (accent?: string): React.CSSProperties => ({
  border: `${BORDER_WIDTH} solid var(--foreground)`,
  boxShadow: `${HARD_SHADOW} ${accent || 'var(--shadow)'}`,
  backgroundColor: 'var(--card-bg)',
})

const TickerStrip: React.FC = React.memo(function TickerStrip() {
  const words = ['MEMORY', 'MAPS', 'PLAQUES', 'RESEARCH', 'BERLIN 1900–1945', 'OUTREACH']
  return (
    <div
      className="overflow-hidden whitespace-nowrap py-2"
      style={{
        borderTop: `${BORDER_WIDTH} solid var(--foreground)`,
        borderBottom: `${BORDER_WIDTH} solid var(--foreground)`,
        backgroundColor: 'var(--primary)',
      }}
      aria-hidden="true"
    >
      <div
        className="font-mono text-sm font-bold tracking-widest"
        style={{ color: 'var(--background)' }}
      >
        {Array.from({ length: 4 }, () => words.join('  ★  ')).join('  ★  ')}
      </div>
    </div>
  )
})

// Exported directly rather than through React.memo: a route's default export
// has to be a plain component function. Wrapped in memo it is an object, which
// Next does not recognise as a page — /collaborate was silently missing from
// the build, so the public collaborator entry point 404'd in production.
const CollaboratePage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 md:px-8 py-3"
        style={{ borderBottom: `${BORDER_WIDTH} solid var(--foreground)` }}
      >
        <Link
          href="/"
          className="font-mono text-sm font-bold uppercase tracking-widest px-3 py-1"
          style={{
            color: 'var(--background)',
            backgroundColor: 'var(--foreground)',
            outline: 'none',
            boxShadow: 'none',
          }}
        >
          ← StoryMaps
        </Link>
        <span
          className="font-mono text-xs uppercase tracking-widest hidden sm:block"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Collaborator Hub
        </span>
      </header>

      {/* Hero */}
      <section className="px-4 md:px-8 pt-12 pb-10 max-w-6xl mx-auto">
        <div
          className="inline-block font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 mb-6"
          style={{
            backgroundColor: 'var(--accent-yellow)',
            color: 'var(--declining-text)',
            border: `${BORDER_WIDTH} solid var(--foreground)`,
          }}
        >
          We need you
        </div>
        <h1
          className="font-mono font-bold uppercase leading-none mb-6"
          style={{ color: 'var(--foreground)', fontSize: 'clamp(2.5rem, 8vw, 5.5rem)' }}
        >
          Help Us
          <br />
          <span style={{ color: 'var(--primary)' }}>Preserve</span>
          <br />
          the Record.
        </h1>
        <p
          className="max-w-2xl text-base md:text-lg leading-relaxed"
          style={{ color: 'var(--foreground-muted)' }}
        >
          StoryMaps documents Jewish-owned businesses in Berlin from 1900 to 1945 — an interactive
          map, a growing archive, and a memorial plaque program. It is built by volunteers:
          developers, researchers, translators, and people willing to knock on doors. This page is
          where you start.
        </p>
      </section>

      <TickerStrip />

      {/* Tracks */}
      <section className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
        <h2
          className="font-mono font-bold uppercase text-2xl md:text-3xl mb-8"
          style={{ color: 'var(--foreground)' }}
        >
          Four ways in_
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TRACKS.map((track) => (
            <div key={track.tag} className="p-6" style={blockStyle(track.accent)}>
              <div
                className="inline-block font-mono text-xs font-bold tracking-widest px-2 py-1 mb-4"
                style={{
                  backgroundColor: track.accent,
                  color: 'var(--active-text)',
                  border: `2px solid var(--foreground)`,
                }}
              >
                {track.tag}
              </div>
              <h3
                className="font-mono font-bold uppercase text-xl mb-3"
                style={{ color: 'var(--foreground)' }}
              >
                {track.title}
              </h3>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: 'var(--foreground-muted)' }}
              >
                {track.description}
              </p>
              <Link
                href={track.href}
                className="inline-block font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)',
                  outline: 'none',
                  boxShadow: `4px 4px 0 ${track.accent}`,
                }}
              >
                {track.linkLabel} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Outreach pipeline */}
      <section className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
        <div className="p-6 md:p-8" style={blockStyle('var(--accent-coral)')}>
          <h2
            className="font-mono font-bold uppercase text-2xl md:text-3xl mb-3"
            style={{ color: 'var(--foreground)' }}
          >
            The outreach pipeline
          </h2>
          <p
            className="text-sm max-w-2xl leading-relaxed mb-6"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Every former business address moves through a tracked pipeline — from first research to
            an approved memorial plaque. The tracker tells you exactly what needs doing next.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {PIPELINE.map((stage, i) => (
              <React.Fragment key={stage.label}>
                <span
                  className="font-mono text-xs font-bold px-3 py-2"
                  style={{
                    backgroundColor: stage.bg,
                    color: stage.fg,
                    border: `2px solid var(--foreground)`,
                  }}
                >
                  {stage.label}
                </span>
                {i < PIPELINE.length - 1 && (
                  <span
                    className="font-mono font-bold"
                    style={{ color: 'var(--foreground)' }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <Link
            href="/admin/outreach"
            className="inline-block font-mono text-sm font-bold uppercase tracking-wider px-5 py-3 transition-transform hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--danger)',
              color: 'var(--closed-text)',
              border: `${BORDER_WIDTH} solid var(--foreground)`,
              outline: 'none',
              boxShadow: `4px 4px 0 var(--foreground)`,
            }}
          >
            Open the tracker →
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
        <h2
          className="font-mono font-bold uppercase text-2xl md:text-3xl mb-8"
          style={{ color: 'var(--foreground)' }}
        >
          Start in three moves_
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.num} className="p-6" style={blockStyle('var(--accent-purple)')}>
              <div
                className="font-mono font-bold text-4xl mb-4 w-14 h-14 flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--accent-yellow)',
                  color: 'var(--declining-text)',
                  border: `${BORDER_WIDTH} solid var(--foreground)`,
                }}
              >
                {step.num}
              </div>
              <h3
                className="font-mono font-bold text-base mb-2"
                style={{ color: 'var(--foreground)' }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Ethos */}
      <section className="px-4 md:px-8 py-12 max-w-6xl mx-auto">
        <div
          className="p-6 md:p-8"
          style={{
            border: `${BORDER_WIDTH} solid var(--foreground)`,
            backgroundColor: 'var(--foreground)',
          }}
        >
          <p
            className="font-mono text-lg md:text-xl font-bold leading-snug max-w-3xl"
            style={{ color: 'var(--background)' }}
          >
            This is a memorial, not a product. Every record is the story of real people. We work
            accurately, respectfully, and in the open.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-4 md:px-8 py-8"
        style={{ borderTop: `${BORDER_WIDTH} solid var(--foreground)` }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-widest">
          <Link href="/" style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}>
            Map
          </Link>
          <Link
            href="/plaques"
            style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
          >
            Plaques
          </Link>
          <Link
            href="https://github.com/samfrons/storytimemaps"
            style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
          >
            GitHub
          </Link>
          <Link
            href="/onboarding"
            style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
          >
            Onboarding
          </Link>
          <Link
            href="/onboarding/outreach"
            style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
          >
            Outreach Guide
          </Link>
          <span style={{ color: 'var(--foreground-muted)' }}>StoryMaps · Berlin 1900–1945</span>
        </div>
        <div className="max-w-6xl mx-auto mt-6">
          <CopyrightLine />
        </div>
      </footer>
    </div>
  )
}

export default CollaboratePage
