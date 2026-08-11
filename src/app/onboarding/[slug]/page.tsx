import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import SiteHeader from '../../components/SiteHeader'
import MarkdownDocument, { readRepoDoc } from '../../components/docs/MarkdownDocument'
import DocTableOfContents from '../../components/docs/DocTableOfContents'
import { ONBOARDING_DOCS, findOnboardingDoc } from '../docs'

export const dynamic = 'force-dynamic'

const GITHUB_REPO = 'https://github.com/samfrons/storytimemaps'

interface DocPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const doc = findOnboardingDoc((await params).slug)
  if (!doc) return { title: 'Guide not found | StoryTimeMaps' }

  return {
    title: `${doc.title} | StoryTimeMaps`,
    description: doc.blurb,
  }
}

export default async function OnboardingDocPage({ params }: DocPageProps) {
  const doc = findOnboardingDoc((await params).slug)
  if (!doc) notFound()

  const content = readRepoDoc(doc.file)
  const sourceUrl = `${GITHUB_REPO}/blob/main/${doc.file}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <SiteHeader />

      {/* Hero */}
      <section className="px-5 sm:px-8 py-14 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] mb-6 transition-opacity hover:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            <span aria-hidden="true">←</span> Onboarding
          </Link>
          <h1
            className="font-kame text-3xl sm:text-5xl leading-tight mb-5"
            style={{ color: 'var(--foreground)' }}
          >
            {content?.title ?? doc.title}
          </h1>
          <p
            className="font-['Inter'] text-base sm:text-lg leading-relaxed mb-8"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {doc.blurb}
          </p>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider border transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            View the source file <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      {/* The document */}
      <section className="px-5 sm:px-8 pb-20 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto pt-16">
          {content ? (
            <>
              <DocTableOfContents headings={content.headings} />
              <MarkdownDocument markdown={content.body} />
            </>
          ) : (
            <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
              This guide is currently unavailable. It can also be read{' '}
              <a
                href={sourceUrl}
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

      {/* The other guides */}
      <section className="px-5 sm:px-8 py-16 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto">
          <h2
            className="font-mono text-[11px] uppercase tracking-[0.3em] mb-6"
            style={{ color: 'var(--primary)' }}
          >
            Keep reading
          </h2>
          <ul className="grid gap-px sm:grid-cols-2" style={{ backgroundColor: 'var(--border)' }}>
            {ONBOARDING_DOCS.filter((other) => other.slug !== doc.slug).map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/onboarding/${other.slug}`}
                  className="block h-full p-5 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: 'var(--card-bg)' }}
                >
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.25em] mb-2"
                    style={{ color: 'var(--muted)' }}
                  >
                    {other.track}
                  </div>
                  <div
                    className="font-mono text-sm font-bold"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {other.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
