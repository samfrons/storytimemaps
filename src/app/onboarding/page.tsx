import React from 'react'
import Link from 'next/link'
import SiteHeader from '../components/SiteHeader'
import MarkdownDocument, { readRepoDoc } from '../components/docs/MarkdownDocument'
import DocTableOfContents from '../components/docs/DocTableOfContents'
import { ONBOARDING_DOCS, ONBOARDING_FILE } from './docs'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Collaborator Onboarding | StoryTimeMaps',
  description:
    'How to contribute to StoryTimeMaps — development setup, the research and outreach tracks, the contribution workflow, and the ground rules for working with this history.',
}

const GITHUB_REPO = 'https://github.com/samfrons/storytimemaps'

export default function OnboardingPage() {
  const guide = readRepoDoc(ONBOARDING_FILE)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <SiteHeader />

      {/* Hero */}
      <section className="px-5 sm:px-8 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: 'var(--primary)' }}
          >
            For collaborators · Free to use
          </p>
          <h1
            className="font-kame text-4xl sm:text-6xl leading-tight mb-6"
            style={{ color: 'var(--foreground)' }}
          >
            Onboarding
          </h1>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed max-w-3xl mb-10"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Everything you need to start contributing — whether you write code, verify histories in
            the archives, contact the occupants of former business addresses, or translate the site.
            You do not need to be a developer to help.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/collaborate"
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--background)' }}
            >
              Choose a track <span aria-hidden="true">→</span>
            </Link>
            <a
              href={`${GITHUB_REPO}/blob/main/${ONBOARDING_FILE}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              View the source file <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* The guide itself */}
      <section className="px-5 sm:px-8 pb-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto pt-16">
          {guide ? (
            <>
              <DocTableOfContents headings={guide.headings} />
              <MarkdownDocument markdown={guide.body} />
            </>
          ) : (
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              The onboarding guide is currently unavailable. It can also be read{' '}
              <a
                href={`${GITHUB_REPO}/blob/main/${ONBOARDING_FILE}`}
                target="_blank"
                rel="noreferrer noopener"
                style={{ color: 'var(--primary)' }}
              >
                on GitHub
              </a>
              .
            </p>
          )}
        </div>
      </section>

      {/* The companion guides */}
      <section className="px-5 sm:px-8 py-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-mono text-[11px] uppercase tracking-[0.3em] mb-8"
            style={{ color: 'var(--primary)' }}
          >
            The other guides
          </h2>
          <div className="grid gap-px sm:grid-cols-2" style={{ backgroundColor: 'var(--border)' }}>
            {ONBOARDING_DOCS.map((doc) => (
              <Link
                key={doc.slug}
                href={`/onboarding/${doc.slug}`}
                className="group block p-6 sm:p-8 transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--card-bg)' }}
              >
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3"
                  style={{ color: 'var(--muted)' }}
                >
                  {doc.track}
                </div>
                <div
                  className="font-mono text-base font-bold mb-3"
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
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
