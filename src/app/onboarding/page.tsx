import React from 'react'
import type { Metadata } from 'next'
import { shareCard } from '../shareCard'
import GuideShell, { type GuideTocEntry } from '../components/docs/GuideShell'
import {
  GuideBullets,
  GuideCallout,
  GuideCards,
  GuideChecklist,
  GuideCode,
  GuideCodeBlock,
  GuideLead,
  GuideProse,
  GuideSection,
  GuideSteps,
  GuideTable,
  type GuideCard,
  type GuideStep,
} from '../components/docs/GuideBlocks'
import { ONBOARDING_FILE } from './docs'
import Link from 'next/link'

/**
 * The collaborator onboarding guide, as a designed page.
 *
 * Curated from `docs/ONBOARDING.md`, which stays in the repo as the
 * GitHub-facing version. The words are the document's; the structure is not —
 * a table of components reads as a table, the setup reads as steps, and the
 * historical-sensitivity rules read as a block a contributor cannot skim past.
 */

export const metadata: Metadata = {
  title: 'Collaborator Onboarding | StoryTimeMaps',
  description:
    'How to contribute to StoryTimeMaps — development setup, the research and outreach tracks, the contribution workflow, and the ground rules for working with this history.',
  alternates: {
    canonical: '/onboarding',
  },
  ...shareCard('onboarding', {
    title: 'Collaborator Onboarding | StoryTimeMaps',
    description:
      'How to contribute to StoryTimeMaps — development, research, outreach, and translation.',
    alt: 'The StoryTimeMaps homepage: 10,021 Jewish-owned businesses drawn as points across Berlin.',
    path: '/onboarding',
  }),
}

const TECH_ARTICLE_LD = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Collaborator Onboarding Guide',
  description:
    'How to contribute to StoryTimeMaps: development setup, contributor tracks, workflow, ground rules, and historical sensitivity.',
  about: 'Contributing to StoryTimeMaps',
  isAccessibleForFree: true,
  inLanguage: 'en',
}

const SECTIONS: readonly GuideTocEntry[] = [
  { id: 'what-this-project-is', title: 'What this project is' },
  { id: 'choose-your-track', title: 'Choose your track' },
  { id: 'development-setup', title: 'Development setup' },
  { id: 'codebase-map', title: 'Codebase map' },
  { id: 'contribution-workflow', title: 'Contribution workflow' },
  { id: 'ground-rules', title: 'Ground rules' },
  { id: 'historical-sensitivity', title: 'Historical sensitivity' },
  { id: 'getting-help', title: 'Getting help' },
]

const PIECES: ReadonlyArray<{ key: string; cells: readonly React.ReactNode[] }> = [
  {
    key: 'map',
    cells: [
      'Interactive map',
      'Time-based visualisation of hundreds of businesses with active / declining / closed states',
      <>
        <GuideCode>/</GuideCode> · <GuideCode>components/MapboxMap.tsx</GuideCode>
      </>,
    ],
  },
  {
    key: 'directory',
    cells: [
      'Business directory',
      'Searchable, filterable listings synced with the map',
      <GuideCode key="c">components/StoryList.tsx</GuideCode>,
    ],
  },
  {
    key: 'plaques',
    cells: [
      'Memorial plaques',
      'Physical plaque program for former business locations',
      <GuideCode key="c">/plaques</GuideCode>,
    ],
  },
  {
    key: 'outreach',
    cells: [
      'Outreach tracker',
      'Admin tool for tracking contact with current property occupants about plaques',
      <GuideCode key="c">/admin/outreach</GuideCode>,
    ],
  },
  {
    key: 'exhibit',
    cells: [
      'Museum exhibit',
      'Touch-screen kiosk version of the map',
      <>
        <GuideCode>/museum-exhibit</GuideCode> · <GuideCode>/exhibit-vision</GuideCode>
      </>,
    ],
  },
  {
    key: 'education',
    cells: [
      'Classroom workbook',
      'Free education materials for ages 13–18',
      <GuideCode key="c">/education</GuideCode>,
    ],
  },
  {
    key: 'frankfurt',
    cells: [
      'Frankfurt pilot',
      'Extension of the model beyond Berlin',
      <GuideCode key="c">/frankfurt</GuideCode>,
    ],
  },
  {
    key: 'collaborate',
    cells: [
      'Collaborate page',
      'Public entry point for new collaborators',
      <GuideCode key="c">/collaborate</GuideCode>,
    ],
  },
]

const TRACKS: readonly GuideCard[] = [
  {
    kicker: '01 / Code',
    title: 'Build the platform',
    body: 'Next.js 16, React 19 and TypeScript work on the map, UI, themes and performance. Start with the development setup below, then the style and performance guides.',
    accent: 'var(--accent-chartreuse)',
    href: '#development-setup',
    linkLabel: 'Set up locally',
  },
  {
    kicker: '02 / Research',
    title: 'Verify the history',
    body: 'Verify business histories, dates and addresses, and process archival sources through the OCR pipeline in the repo-root Python scripts. Start with the dataset cleaning report and the geocoding guide.',
    accent: 'var(--accent-yellow)',
    href: 'https://github.com/samfrons/storytimemaps/issues?q=label%3Aresearch',
    linkLabel: 'Research issues',
    external: true,
  },
  {
    kicker: '03 / Outreach',
    title: 'Place the plaques',
    body: 'Contact the current occupants of former business addresses about memorial plaques, address by address, in a tracked pipeline. Read the outreach guide before your first message.',
    accent: 'var(--accent-coral)',
    href: '/onboarding/outreach',
    linkLabel: 'Outreach guide',
  },
  {
    kicker: '04 / Translation',
    title: 'Cross the languages',
    body: (
      <>
        English, German, Yiddish and Hebrew localisation, right-to-left included. The strings live
        in <GuideCode>src/i18n/</GuideCode>.
      </>
    ),
    accent: 'var(--accent-purple)',
    href: 'https://github.com/samfrons/storytimemaps/issues?q=label%3Ai18n',
    linkLabel: 'i18n issues',
    external: true,
  },
]

const SETUP_CODE = `git clone https://github.com/samfrons/storytimemaps.git
cd storytimemaps
pnpm install

# Environment
cp .env.example .env.local   # or create .env.local manually
# Add: NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
# NEVER commit token values.

pnpm dev                     # http://localhost:3000`

const TREE_CODE = `src/
  app/
    page.tsx              # Main map page (URL param handling — be careful here)
    layout.tsx            # ThemeProvider config — DO NOT change its settings
    globals.css           # Theme color definitions (CSS variables)
    components/           # All React components (PascalCase)
      outreach/           # Outreach tracker UI
    admin/outreach/       # Outreach admin page
    api/outreach/         # Outreach data API
    collaborate/          # Public collaborator page
  lib/types/outreach.ts   # Outreach data model
  i18n/                   # Translations (en/de/yi/he)
public/
  data/                   # All HTTP-served data files (timeline JSON, CSV)
docs/                     # Guides (theming, outreach, tasks, this file)`

const WORKFLOW: readonly GuideStep[] = [
  {
    title: 'Claim a task',
    body: (
      <>
        Open a GitHub issue — or comment on an existing one — so that two people never do the same
        work. The{' '}
        <Link href="/onboarding/tasks" style={{ color: 'var(--primary)' }}>
          task tracking guide
        </Link>{' '}
        explains where each kind of work is queued.
      </>
    ),
  },
  {
    title: 'Branch',
    body: (
      <>
        <GuideCode>git checkout -b &lt;type&gt;/&lt;short-description&gt;</GuideCode> — for example{' '}
        <GuideCode>feat/plaque-filter</GuideCode>.
      </>
    ),
  },
  {
    title: 'Develop',
    body: 'Follow the ground rules below and the patterns of the components already in the file you are working near.',
  },
  {
    title: 'Run the pre-commit checklist',
    body: 'Everything in the checklist below has to pass before you commit. It is the same list the maintainer checks a pull request against.',
  },
  {
    title: 'Commit',
    body: (
      <>
        Conventional commits: <GuideCode>feat:</GuideCode>, <GuideCode>fix:</GuideCode>,{' '}
        <GuideCode>perf:</GuideCode>, <GuideCode>style:</GuideCode>,{' '}
        <GuideCode>refactor:</GuideCode>, <GuideCode>docs:</GuideCode>.
      </>
    ),
  },
  {
    title: 'Open a pull request',
    body: 'Describe what changed and which themes and pages you tested it on.',
  },
]

const GROUND_RULES: ReadonlyArray<{ key: string; cells: readonly React.ReactNode[] }> = [
  {
    key: 'radius',
    cells: [
      'No rounded corners',
      'Sharp rectangular edges everywhere, unless explicitly asked for.',
    ],
  },
  {
    key: 'colors',
    cells: [
      'No hardcoded colours',
      <>
        Always <GuideCode>var(--variable)</GuideCode>. The only exception is Mapbox layer styling,
        which needs hex values — take those from the theme functions. Ten themes exist;{' '}
        <GuideCode>brutal-pop</GuideCode> is the default and doubles as the museum-exhibit kiosk
        palette.
      </>,
    ],
  },
  {
    key: 'focus',
    cells: [
      'No blue focus outlines',
      'Build custom focus states from border or background changes instead.',
    ],
  },
  {
    key: 'theme',
    cells: [
      'Do not touch the theme system',
      <>
        Read the theme rules in <GuideCode>CLAUDE.md</GuideCode> and the{' '}
        <Link href="/onboarding/theming" style={{ color: 'var(--primary)' }}>
          theming guide
        </Link>{' '}
        first.
      </>,
    ],
  },
  {
    key: 'type',
    cells: ['Typography', 'Space Mono for data, labels and technical text; Inter for body copy.'],
  },
  {
    key: 'perf',
    cells: [
      'Performance',
      <>
        <GuideCode>React.memo()</GuideCode> for components that receive props,{' '}
        <GuideCode>useMemo</GuideCode> for expensive work, scroll throttled to 100–150 ms, inputs
        debounced to 300–500 ms, heavy components dynamically imported.
      </>,
    ],
  },
  {
    key: 'suspense',
    cells: [
      'Suspense',
      <>
        Any page touching <GuideCode>useSearchParams()</GuideCode> — including indirectly, through{' '}
        <GuideCode>Sidebar</GuideCode> — must be wrapped in a Suspense boundary, or the production
        build fails.
      </>,
    ],
  },
  {
    key: 'static',
    cells: [
      'Static files',
      <>
        Everything served over HTTP lives in <GuideCode>/public/</GuideCode>. Nothing else is served
        at all.
      </>,
    ],
  },
]

export default function OnboardingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(TECH_ARTICLE_LD) }}
      />
      <GuideShell
        kicker="For collaborators · Free to use"
        title={
          <>
            Collaborator
            <br />
            Onboarding
          </>
        }
        lead="Everything you need to start contributing — whether you write code, verify histories in the archives, contact the occupants of former business addresses, or translate the site. You do not need to be a developer to help."
        sourceFile={ONBOARDING_FILE}
        sections={SECTIONS}
        actions={
          <Link
            href="#choose-your-track"
            className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--background)',
              border: '3px solid var(--foreground)',
              outline: 'none',
              boxShadow: '4px 4px 0 var(--foreground)',
            }}
          >
            Choose a track <span aria-hidden="true">↓</span>
          </Link>
        }
      >
        <div className="space-y-4 mb-4">
          <GuideCallout tone="critical" title="Read this first">
            <p>
              StoryMaps is an interactive memorial platform documenting Jewish-owned businesses in
              Berlin — and now Frankfurt — from 1900 to 1945. It visualises a difficult period in
              history. The goal is to preserve memory and educate, not to entertain. Keep all work
              respectful, historically accurate and objective.
            </p>
            <p>
              <a href="#historical-sensitivity" style={{ color: 'var(--primary)' }}>
                The sensitivity rules in §7
              </a>{' '}
              apply to every contributor, on every track.
            </p>
          </GuideCallout>
        </div>

        <GuideSection
          id="what-this-project-is"
          number="01"
          title="What this project is"
          intro={
            <GuideLead>
              One archive, served through several front doors. Knowing which piece your work touches
              is usually enough to find the code.
            </GuideLead>
          }
        >
          <GuideTable
            columns={['Piece', 'What it does', 'Where']}
            rows={PIECES}
            accent="var(--accent-purple)"
          />
        </GuideSection>

        <GuideSection
          id="choose-your-track"
          number="02"
          title="Choose your track"
          intro={<GuideLead>You do not need to be a developer to contribute.</GuideLead>}
        >
          <GuideCards cards={TRACKS} />
          <GuideProse>
            Whatever your track, read the{' '}
            <a href="#ground-rules" style={{ color: 'var(--primary)' }}>
              ground rules
            </a>{' '}
            — they apply to everyone.
          </GuideProse>
        </GuideSection>

        <GuideSection
          id="development-setup"
          number="03"
          title="Development setup"
          intro={<GuideLead>Ten minutes from a clone to a map running locally.</GuideLead>}
        >
          <GuideBullets
            items={[
              <>
                <strong style={{ color: 'var(--foreground)' }}>Node.js 20+</strong> — the project
                runs Next.js 16 and React 19.
              </>,
              <>
                <strong style={{ color: 'var(--foreground)' }}>pnpm</strong> — preferred; npm and
                yarn also work.
              </>,
              <>
                <strong style={{ color: 'var(--foreground)' }}>A Mapbox account</strong> — for a
                free API token.
              </>,
              <>
                <strong style={{ color: 'var(--foreground)' }}>Python 3.10+</strong> — only if you
                are working on the data or scraping scripts.
              </>,
            ]}
          />
          <GuideCodeBlock label="Prerequisites installed? Then:" code={SETUP_CODE} />
          <GuideChecklist
            title="Verify your setup"
            items={[
              <>
                The map loads at <GuideCode>/</GuideCode> without console errors.
              </>,
              'The time slider changes business marker states.',
              <>
                Theme switching is instant. The default theme is <GuideCode>brutal-pop</GuideCode>;
                try <GuideCode>?theme=cool</GuideCode> in the URL.
              </>,
              <>
                <GuideCode>pnpm run build</GuideCode> completes without errors.
              </>,
            ]}
          />
        </GuideSection>

        <GuideSection
          id="codebase-map"
          number="04"
          title="Codebase map"
          intro={
            <GuideLead>
              The naming is consistent — components in PascalCase, hooks as{' '}
              <GuideCode>useX</GuideCode>, utilities in camelCase — so grep finds most things faster
              than a directory tree does.
            </GuideLead>
          }
        >
          <GuideCodeBlock label="Where things live" code={TREE_CODE} />
          <GuideProse>Key documents, in reading order:</GuideProse>
          <GuideBullets
            marker="→"
            items={[
              <>
                <GuideCode>CLAUDE.md</GuideCode> —{' '}
                <strong style={{ color: 'var(--foreground)' }}>the rulebook.</strong> Non-negotiable
                design, theme and deployment rules.
              </>,
              <>
                <Link href="/onboarding/theming" style={{ color: 'var(--primary)' }}>
                  Theming &amp; routing
                </Link>{' '}
                — the theme system deep dive.
              </>,
              <>
                <Link href="/onboarding/outreach" style={{ color: 'var(--primary)' }}>
                  Outreach guide
                </Link>{' '}
                — the outreach pipeline and workflow.
              </>,
              <>
                <Link href="/onboarding/tasks" style={{ color: 'var(--primary)' }}>
                  Task tracking
                </Link>{' '}
                — how work is organised and claimed.
              </>,
              <>
                <Link href="/onboarding/style" style={{ color: 'var(--primary)' }}>
                  Style guide
                </Link>{' '}
                and{' '}
                <Link href="/onboarding/performance" style={{ color: 'var(--primary)' }}>
                  performance rules
                </Link>{' '}
                — the specifics.
              </>,
            ]}
          />
        </GuideSection>

        <GuideSection id="contribution-workflow" number="05" title="Contribution workflow">
          <GuideSteps steps={WORKFLOW} />
          <GuideChecklist
            title="Pre-commit checklist"
            items={[
              <>
                <GuideCode>pnpm run build</GuideCode> passes with no errors.
              </>,
              <>
                No TypeScript errors — <GuideCode>npx tsc --noEmit</GuideCode>.
              </>,
              'No border-radius anywhere; every colour comes from a CSS variable.',
              'All themes tested: brutal-pop (the default) plus moody, hot, cold, warm, cool, bauhaus, art-nouveau, archival and hoefe.',
              <>
                Components memoised; any page using <GuideCode>useSearchParams()</GuideCode> wrapped
                in <GuideCode>&lt;Suspense&gt;</GuideCode>.
              </>,
            ]}
          />
        </GuideSection>

        <GuideSection
          id="ground-rules"
          number="06"
          title="Ground rules"
          intro={
            <GuideLead>
              The short version of <GuideCode>CLAUDE.md</GuideCode>. Where the two disagree, the
              full file wins.
            </GuideLead>
          }
        >
          <GuideTable
            columns={['Rule', 'What it means']}
            rows={GROUND_RULES}
            accent="var(--accent-coral)"
          />
        </GuideSection>

        <GuideSection
          id="historical-sensitivity"
          number="07"
          title="Historical sensitivity"
          intro={
            <GuideLead>
              This is a memorial project. Every contributor, on every track, agrees to the
              following.
            </GuideLead>
          }
        >
          <GuideCallout tone="critical" title="Non-negotiable">
            <p>
              Treat every business record as the story of real people, many of whom were persecuted,
              dispossessed, deported or murdered.
            </p>
            <p>
              Maintain historical accuracy. Cite sources for data changes, and when a date or a fact
              is uncertain, mark it uncertain rather than guessing.
            </p>
            <p>
              Avoid sensationalism in copy, imagery and UI. Present closures and
              &quot;Aryanisation&quot; objectively; never gamify them.
            </p>
            <p>
              In outreach, be respectful of current occupants — they carry no responsibility for the
              history of the address. The tone guidance is in the{' '}
              <Link href="/onboarding/outreach" style={{ color: 'var(--primary)' }}>
                outreach guide
              </Link>
              .
            </p>
          </GuideCallout>
        </GuideSection>

        <GuideSection id="getting-help" number="08" title="Getting help">
          <GuideBullets
            items={[
              <>
                <strong style={{ color: 'var(--foreground)' }}>
                  Questions about rules or architecture:
                </strong>{' '}
                open a GitHub issue with the <GuideCode>question</GuideCode> label.
              </>,
              <>
                <strong style={{ color: 'var(--foreground)' }}>
                  Project coordination and outreach access:
                </strong>{' '}
                contact the maintainer — the repo owner.
              </>,
              <>
                <strong style={{ color: 'var(--foreground)' }}>Where things are:</strong> grep is
                your friend. The codebase follows consistent naming throughout.
              </>,
            ]}
          />
          <div
            className="p-6 sm:p-7 mt-2"
            style={{
              border: '3px solid var(--foreground)',
              backgroundColor: 'var(--foreground)',
            }}
          >
            <p
              className="font-mono text-base sm:text-lg font-bold leading-snug max-w-3xl"
              style={{ color: 'var(--background)' }}
            >
              Welcome aboard — thank you for helping preserve this history.
            </p>
          </div>
        </GuideSection>
      </GuideShell>
    </>
  )
}
