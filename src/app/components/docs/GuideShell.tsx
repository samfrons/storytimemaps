import React from 'react'
import Link from 'next/link'
import SiteHeader from '../SiteHeader'
import { ONBOARDING_DOCS } from '../../onboarding/docs'
import { GUIDE_BORDER } from './GuideBlocks'
import SiteCredit from '../SiteCredit'

/**
 * The frame every contributor guide is served in.
 *
 * One shell — hero, section index, footer navigation between the guides —
 * so that a reader moving from onboarding to the outreach guide stays in the
 * same document, and so a guide that is still rendered from Markdown looks
 * like a sibling of the ones that are hand-designed rather than an orphan.
 */

const GITHUB_REPO = 'https://github.com/samfrons/storytimemaps'

export interface GuideTocEntry {
  id: string
  title: string
}

interface GuideShellProps {
  /** Small label above the title: the track, or the audience. */
  kicker: string
  title: React.ReactNode
  /** One or two sentences saying who the guide is for. */
  lead: React.ReactNode
  /** The repo file this guide was curated from, linked as the source of truth. */
  sourceFile: string
  sections: readonly GuideTocEntry[]
  /** Slug of the guide being read; omit on the /onboarding index. */
  currentSlug?: string
  /** Extra buttons rendered beside the source-file link. */
  actions?: React.ReactNode
  children: React.ReactNode
}

const TocList: React.FC<{ sections: readonly GuideTocEntry[]; compact?: boolean }> = ({
  sections,
  compact,
}) => (
  <ol className={compact ? 'grid sm:grid-cols-2 gap-x-8 gap-y-2.5' : 'space-y-2.5'}>
    {sections.map((section, index) => (
      <li key={section.id} className="flex gap-2.5">
        <span
          className="font-mono text-[10px] pt-[3px] shrink-0"
          style={{ color: 'var(--muted)' }}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <a
          href={`#${section.id}`}
          className="font-mono text-xs leading-relaxed transition-opacity hover:opacity-70"
          style={{ color: 'var(--foreground)', outline: 'none', boxShadow: 'none' }}
        >
          {section.title}
        </a>
      </li>
    ))}
  </ol>
)

const GuideShell: React.FC<GuideShellProps> = ({
  kicker,
  title,
  lead,
  sourceFile,
  sections,
  currentSlug,
  actions,
  children,
}) => {
  const others = ONBOARDING_DOCS.filter((doc) => doc.slug !== currentSlug)
  const sourceUrl = `${GITHUB_REPO}/blob/main/${sourceFile}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <SiteHeader />

      {/* Hero */}
      <section className="px-5 sm:px-8 pt-12 sm:pt-16 pb-10">
        <div className="max-w-6xl mx-auto">
          {currentSlug && (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] mb-7 px-3 py-1.5 transition-transform hover:-translate-y-0.5"
              style={{
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                outline: 'none',
                boxShadow: 'none',
              }}
            >
              <span aria-hidden="true">←</span> Onboarding
            </Link>
          )}
          <p
            className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            {kicker}
          </p>
          <h1
            className="font-mono font-bold uppercase leading-[0.95] mb-6"
            style={{ color: 'var(--foreground)', fontSize: 'clamp(2.2rem, 6.5vw, 4rem)' }}
          >
            {title}
          </h1>
          <div
            className="font-['Inter'] text-base sm:text-lg leading-relaxed max-w-3xl mb-8"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {lead}
          </div>
          <div className="flex flex-wrap gap-3">
            {actions}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5"
              style={{
                border: GUIDE_BORDER,
                color: 'var(--foreground)',
                backgroundColor: 'var(--card-bg)',
                outline: 'none',
                boxShadow: 'none',
              }}
            >
              Source file on GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* Body + section index */}
      <div className="px-5 sm:px-8 pb-16" style={{ borderTop: GUIDE_BORDER }}>
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-14 pt-12">
          {/* Compact index, above the content on small screens */}
          {sections.length > 1 && (
            <nav
              aria-label="On this page"
              className="lg:hidden p-5 mb-12 print:hidden"
              style={{ border: GUIDE_BORDER, backgroundColor: 'var(--card-bg)' }}
            >
              <h2
                className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] mb-4"
                style={{ color: 'var(--muted)' }}
              >
                On this page
              </h2>
              <TocList sections={sections} compact />
            </nav>
          )}

          <main className="min-w-0">{children}</main>

          {sections.length > 1 && (
            <nav
              aria-label="On this page"
              className="hidden lg:block print:hidden lg:row-start-1 lg:col-start-2"
            >
              <div
                className="sticky top-24 p-5"
                style={{ border: GUIDE_BORDER, backgroundColor: 'var(--card-bg)' }}
              >
                <h2
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] mb-4"
                  style={{ color: 'var(--muted)' }}
                >
                  On this page
                </h2>
                <TocList sections={sections} />
              </div>
            </nav>
          )}
        </div>
      </div>

      {/* Keep reading */}
      <section className="px-5 sm:px-8 py-14" style={{ borderTop: GUIDE_BORDER }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="font-mono font-bold uppercase text-lg sm:text-xl mb-7"
            style={{ color: 'var(--foreground)' }}
          >
            {currentSlug ? 'Keep reading_' : 'The companion guides_'}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/onboarding/${doc.slug}`}
                  className="block h-full p-5 transition-transform hover:-translate-y-0.5"
                  style={{
                    border: GUIDE_BORDER,
                    backgroundColor: 'var(--card-bg)',
                    boxShadow: '6px 6px 0 var(--primary)',
                    outline: 'none',
                  }}
                >
                  <div
                    className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] mb-3"
                    style={{ color: 'var(--muted)' }}
                  >
                    {doc.track}
                  </div>
                  <div
                    className="font-mono font-bold uppercase text-base mb-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {doc.title}
                  </div>
                  <p
                    className="font-['Inter'] text-sm leading-relaxed"
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    {doc.blurb}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 sm:px-8 py-8" style={{ borderTop: GUIDE_BORDER }}>
        <div className="max-w-6xl mx-auto flex flex-wrap gap-x-8 gap-y-3 font-mono text-xs uppercase tracking-widest">
          <Link href="/" style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}>
            Map
          </Link>
          <Link
            href="/collaborate"
            style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
          >
            Collaborate
          </Link>
          <Link
            href="/onboarding"
            style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
          >
            Onboarding
          </Link>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: 'var(--primary)', outline: 'none', boxShadow: 'none' }}
          >
            GitHub
          </a>
          <span style={{ color: 'var(--foreground-muted)' }}>StoryMaps · Berlin 1900–1945</span>
          <SiteCredit className="normal-case tracking-normal" />
        </div>
      </footer>
    </div>
  )
}

export default React.memo(GuideShell)
