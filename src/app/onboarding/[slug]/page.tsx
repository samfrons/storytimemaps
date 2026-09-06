import React from 'react'
import { shareCard } from '../../shareCard'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import GuideShell, { type GuideTocEntry } from '../../components/docs/GuideShell'
import MarkdownDocument, { readRepoDoc } from '../../components/docs/MarkdownDocument'
import TasksGuideContent, { TASKS_SECTIONS } from '../../components/docs/guides/TasksGuide'
import OutreachGuideContent, { OUTREACH_SECTIONS } from '../../components/docs/guides/OutreachGuide'
import { findOnboardingDoc, type OnboardingDoc } from '../docs'

/**
 * A companion guide.
 *
 * Two of these — task tracking and outreach — are hand-designed pages built
 * from structured content, because they are read by people who will never open
 * the repo. The three code-reference guides (theming, style, performance) are
 * dense API-and-snippet material that would lose accuracy if it were
 * paraphrased, so they keep the Markdown renderer, wrapped in the same shell:
 * same hero, same section index, same navigation between guides.
 */

export const dynamic = 'force-dynamic'

/** The lead paragraph shown in the hero, where the blurb is too terse. */
const LEADS: Readonly<Record<string, string>> = {
  tasks:
    'How work is organised so collaborators can pick things up without stepping on each other: where each kind of task is queued, how to claim one, and what to do when it stalls.',
  outreach:
    'How we track contact with the current occupants of former Jewish business addresses in Berlin, as part of the memorial plaque program — the status pipeline, the research workflow, and the tone every message has to keep.',
  theming:
    'The theme system, URL-based theme state, and the rules that keep switching instant. Reference material for anyone touching colour, routing, or the theme provider.',
  style:
    'Typography, colour variables, and the component patterns every page is built from. The canonical reference — check it before inventing a new pattern.',
  performance:
    'Memoisation, throttling, and the map-specific budgets a change has to stay inside. Read it before adding anything to the map or the timeline.',
}

interface DocPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const doc = findOnboardingDoc((await params).slug)
  if (!doc) return { title: 'Guide not found | StoryTimeMaps' }

  return {
    title: `${doc.title} | StoryTimeMaps`,
    description: doc.blurb,
    alternates: {
      canonical: `/onboarding/${doc.slug}`,
    },
    ...shareCard('onboarding', {
      title: `${doc.title} | StoryTimeMaps`,
      description: doc.blurb,
      alt: 'The StoryTimeMaps homepage: 10,021 Jewish-owned businesses drawn as points across Berlin.',
      path: `/onboarding/${doc.slug}`,
    }),
  }
}

/**
 * The guides authored as pages, keyed by slug. A slug missing from this map
 * falls back to the Markdown renderer rather than 404ing, so adding a document
 * to `docs.ts` publishes it immediately and designing it is a later step.
 */
const DESIGNED: Readonly<
  Record<string, { sections: readonly GuideTocEntry[]; Content: React.ComponentType }>
> = {
  tasks: { sections: TASKS_SECTIONS, Content: TasksGuideContent },
  outreach: { sections: OUTREACH_SECTIONS, Content: OutreachGuideContent },
}

/** The Markdown-rendered guides, with a section index read from the file. */
const RenderedDocument: React.FC<{ doc: OnboardingDoc }> = ({ doc }) => {
  const content = readRepoDoc(doc.file)

  if (!content) {
    return (
      <p className="font-mono text-sm" style={{ color: 'var(--foreground-muted)' }}>
        This guide is currently unavailable. It can also be read on GitHub — the link is in the
        header above.
      </p>
    )
  }

  return <MarkdownDocument markdown={content.body} />
}

function markdownSections(doc: OnboardingDoc): readonly GuideTocEntry[] {
  const content = readRepoDoc(doc.file)
  if (!content) return []
  return content.headings.map((heading) => ({ id: heading.id, title: heading.text }))
}

export default async function OnboardingDocPage({ params }: DocPageProps) {
  const doc = findOnboardingDoc((await params).slug)
  if (!doc) notFound()

  const designed = DESIGNED[doc.slug]
  const sections = designed ? designed.sections : markdownSections(doc)

  const techArticleLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: doc.title,
    description: doc.blurb,
    about: doc.track,
    isAccessibleForFree: true,
    inLanguage: 'en',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleLd) }}
      />
      <GuideShell
        kicker={`${doc.track} · Contributor guide`}
        title={doc.title}
        lead={LEADS[doc.slug] ?? doc.blurb}
        sourceFile={doc.file}
        sections={sections}
        currentSlug={doc.slug}
      >
        {designed ? <designed.Content /> : <RenderedDocument doc={doc} />}
      </GuideShell>
    </>
  )
}
