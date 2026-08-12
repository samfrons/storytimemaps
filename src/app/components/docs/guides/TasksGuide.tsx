import React from 'react'
import Link from 'next/link'
import type { GuideTocEntry } from '../GuideShell'
import {
  GuideBullets,
  GuideCallout,
  GuideCode,
  GuideLead,
  GuideProse,
  GuideSection,
  GuideSteps,
  GuideTable,
  guideBlockStyle,
  type GuideStep,
} from '../GuideBlocks'

/**
 * The task-tracking guide, curated from `docs/TASK_TRACKING.md`.
 *
 * The document is short and almost entirely reference material — where work
 * is queued, which labels mean what, how a claim is made — so it is set as
 * tables and a numbered claim-to-close sequence rather than prose.
 */

export const TASKS_SECTIONS: readonly GuideTocEntry[] = [
  { id: 'where-tasks-live', title: 'Where tasks live' },
  { id: 'labels', title: 'Labels' },
  { id: 'claiming-a-task', title: 'Claiming & working a task' },
  { id: 'workstreams', title: 'Workstreams' },
  { id: 'proposing-new-work', title: 'Proposing new work' },
]

const QUEUES: ReadonlyArray<{ key: string; cells: readonly React.ReactNode[] }> = [
  { key: 'code', cells: ['Code features & bugs', 'GitHub Issues on this repo'] },
  {
    key: 'outreach',
    cells: [
      'Outreach (per address)',
      <>
        The outreach tracker at <GuideCode>/admin/outreach</GuideCode> — see the{' '}
        <Link href="/onboarding/outreach" style={{ color: 'var(--primary)' }}>
          outreach guide
        </Link>
        .
      </>,
    ],
  },
  {
    key: 'research',
    cells: [
      'Research & data cleanup',
      <>
        GitHub Issues with the <GuideCode>research</GuideCode> label
      </>,
    ],
  },
  {
    key: 'i18n',
    cells: [
      'Translations',
      <>
        GitHub Issues with the <GuideCode>i18n</GuideCode> label
      </>,
    ],
  },
]

const LABELS: ReadonlyArray<{ key: string; cells: readonly React.ReactNode[] }> = [
  {
    key: 'track',
    cells: [
      'code · research · outreach · i18n · design',
      'The track the task belongs to, so people can filter to their own.',
    ],
  },
  {
    key: 'first',
    cells: ['good-first-task', 'Well scoped and low context — ideal for a new collaborator.'],
  },
  {
    key: 'blocked',
    cells: ['blocked', 'Waiting on data, access or a decision. Say which, in a comment.'],
  },
  { key: 'question', cells: ['question', 'Needs maintainer input before it can move.'] },
]

const CLAIM_STEPS: readonly GuideStep[] = [
  {
    title: 'Claim',
    body: (
      <>
        Comment &quot;taking this&quot; on the issue, or assign yourself. One task at a time until
        you know the codebase.
      </>
    ),
  },
  {
    title: 'Work',
    body: (
      <>
        Branch as <GuideCode>&lt;type&gt;/&lt;short-description&gt;</GuideCode> and follow the{' '}
        <Link href="/onboarding#contribution-workflow" style={{ color: 'var(--primary)' }}>
          pre-commit checklist
        </Link>
        .
      </>
    ),
  },
  {
    title: 'Update',
    body: 'If a task takes more than a week, drop a one-line status comment so it does not look abandoned. Stale claims — two weeks or more of silence — are fair game for someone else to pick up.',
  },
  {
    title: 'Close',
    body: 'Once the pull request is merged, close the issue with a link to it.',
  },
]

const WORKSTREAMS: ReadonlyArray<{ name: string; text: string }> = [
  { name: 'Map & timeline', text: 'Performance, clustering, time-slider states.' },
  { name: 'Data integrity', text: 'Date verification, geocoding fixes, duplicate cleanup.' },
  { name: 'Plaque program', text: 'Plaque pages, the inquiry form, the production pipeline.' },
  { name: 'Outreach', text: 'Occupant research and contact, driven by the tracker.' },
  { name: 'Localisation', text: 'German, Yiddish and Hebrew translation, and RTL support.' },
  { name: 'Frankfurt expansion', text: 'Extending the platform beyond Berlin.' },
]

const TasksGuideContent: React.FC = () => (
  <>
    <GuideSection
      id="where-tasks-live"
      number="01"
      title="Where tasks live"
      intro={
        <GuideLead>
          GitHub Issues is the single queue for everything except per-address outreach, which has
          its own purpose-built tracker.
        </GuideLead>
      }
    >
      <GuideTable columns={['Kind of work', 'Tracked in']} rows={QUEUES} />
    </GuideSection>

    <GuideSection
      id="labels"
      number="02"
      title="Labels"
      intro={<GuideLead>Label every issue so people can filter by track.</GuideLead>}
    >
      <GuideTable columns={['Label', 'Meaning']} rows={LABELS} accent="var(--accent-yellow)" />
    </GuideSection>

    <GuideSection id="claiming-a-task" number="03" title="Claiming & working a task">
      <GuideSteps steps={CLAIM_STEPS} />
    </GuideSection>

    <GuideSection
      id="workstreams"
      number="04"
      title="Workstreams"
      intro={<GuideLead>The standing buckets new tasks fall into.</GuideLead>}
    >
      <ol className="grid gap-5 sm:grid-cols-2">
        {WORKSTREAMS.map((stream, index) => (
          <li key={stream.name} className="p-5" style={guideBlockStyle('var(--accent-purple)', 5)}>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.2em] mb-3"
              style={{ color: 'var(--muted)' }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
            <h3
              className="font-mono font-bold uppercase text-sm mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              {stream.name}
            </h3>
            <p
              className="font-['Inter'] text-[15px] leading-relaxed"
              style={{ color: 'var(--foreground-muted)' }}
            >
              {stream.text}
            </p>
          </li>
        ))}
      </ol>
    </GuideSection>

    <GuideSection id="proposing-new-work" number="05" title="Proposing new work">
      <GuideProse>
        Open an issue describing <strong style={{ color: 'var(--foreground)' }}>what</strong> and{' '}
        <strong style={{ color: 'var(--foreground)' }}>why</strong> before building anything.
      </GuideProse>
      <GuideCallout tone="warning" title="Wait for sign-off">
        <p>
          For anything touching the theme system, map rendering or the data schema, wait for
          maintainer sign-off before you start. Those areas carry strict rules — see{' '}
          <GuideCode>CLAUDE.md</GuideCode> and the{' '}
          <Link href="/onboarding/theming" style={{ color: 'var(--primary)' }}>
            theming guide
          </Link>{' '}
          — and a long history behind them.
        </p>
      </GuideCallout>
      <GuideBullets
        items={[
          <>
            New to the project? Filter for <GuideCode>good-first-task</GuideCode> and read the{' '}
            <Link href="/onboarding" style={{ color: 'var(--primary)' }}>
              onboarding guide
            </Link>{' '}
            first.
          </>,
        ]}
      />
    </GuideSection>
  </>
)

export default React.memo(TasksGuideContent)
