/**
 * The contributor documentation published as pages, in reading order.
 *
 * The guides were previously reachable only as raw Markdown on GitHub, which
 * asked a historian or a teacher — the people this project most needs — to
 * read a code-hosting page to find out how to help. The files stay in the repo
 * as the single source of truth; this list decides which of them the site
 * renders and under what URL.
 *
 * Keep the slugs in step with `DOC_ROUTES` in
 * `src/app/components/docs/MarkdownDocument.tsx`, which rewrites the `.md`
 * cross-links inside the documents to point at these pages.
 */
export interface OnboardingDoc {
  slug: string
  /** Path from the repo root. */
  file: string
  /** Short title for cards, navigation, and the page hero. */
  title: string
  /** Who the document is for, and what it answers. */
  blurb: string
  /** The track it belongs to, shown as the card's kicker. */
  track: string
}

export const ONBOARDING_FILE = 'docs/ONBOARDING.md'

export const ONBOARDING_DOCS: readonly OnboardingDoc[] = [
  {
    slug: 'tasks',
    file: 'docs/TASK_TRACKING.md',
    title: 'Task Tracking',
    blurb: 'How work is organised and claimed, so two people never research the same block.',
    track: 'Everyone',
  },
  {
    slug: 'outreach',
    file: 'docs/OUTREACH_TRACKING.md',
    title: 'Outreach Guide',
    blurb:
      'Contacting the current occupants of former business addresses about a plaque — process and tone.',
    track: 'Outreach',
  },
  {
    slug: 'theming',
    file: 'docs/THEMING_GUIDE.md',
    title: 'Theming & Routing',
    blurb: 'The theme system, URL-based theme state, and the rules that keep switching instant.',
    track: 'Code',
  },
  {
    slug: 'style',
    file: 'STYLE.md',
    title: 'Style Guide',
    blurb: 'Typography, colour variables, and the component patterns every page is built from.',
    track: 'Code',
  },
  {
    slug: 'performance',
    file: 'PERFORMANCE_RULES.md',
    title: 'Performance Rules',
    blurb: 'Memoisation, throttling, and the map-specific budgets a change has to stay inside.',
    track: 'Code',
  },
]

export function findOnboardingDoc(slug: string): OnboardingDoc | undefined {
  return ONBOARDING_DOCS.find((doc) => doc.slug === slug)
}
