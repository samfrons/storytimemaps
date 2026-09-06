import React from 'react'
import Link from 'next/link'
import type { GuideTocEntry } from '../GuideShell'
import {
  GuideBullets,
  GuideCallout,
  GuideCode,
  GuideLead,
  GuideProse,
  GuidePipeline,
  GuideSection,
  GuideSteps,
  GuideTable,
  guideBlockStyle,
  type GuideStep,
  type PipelineStage,
} from '../GuideBlocks'

/**
 * The outreach guide, curated from `docs/OUTREACH_TRACKING.md`.
 *
 * The status pipeline was an ASCII diagram in the Markdown, which is unreadable
 * on a phone and meaningless to a screen reader; here it is a labelled flow of
 * the same stages plus the table that says what each one obliges you to do
 * next. The contact-guidelines section is set as a callout because getting the
 * tone wrong with an occupant is the one mistake that cannot be undone.
 */

export const OUTREACH_SECTIONS: readonly GuideTocEntry[] = [
  { id: 'the-pipeline', title: 'The pipeline' },
  { id: 'research-workflow', title: 'Research workflow' },
  { id: 'contact-guidelines', title: 'Contact guidelines' },
  { id: 'data-hygiene', title: 'Data hygiene' },
  { id: 'weekly-rhythm', title: 'Weekly rhythm' },
  { id: 'where-the-code-lives', title: 'Where the code lives' },
]

const PIPELINE: readonly PipelineStage[] = [
  { label: 'Not started', bg: 'var(--muted)', fg: 'var(--foreground)' },
  { label: 'Researching', bg: 'var(--primary)', fg: 'var(--background)' },
  { label: 'Contacted', bg: 'var(--primary)', fg: 'var(--background)' },
  { label: 'Awaiting response', bg: 'var(--warning)', fg: 'var(--declining-text)' },
  { label: 'Interested', bg: 'var(--success)', fg: 'var(--active-text)' },
  { label: 'Approved', bg: 'var(--success)', fg: 'var(--active-text)' },
]

const BRANCHES: readonly PipelineStage[] = [
  { label: 'Follow-up needed', bg: 'var(--warning)', fg: 'var(--declining-text)' },
  { label: 'Declined', bg: 'var(--danger)', fg: 'var(--closed-text)' },
  { label: 'Not applicable', bg: 'var(--muted)', fg: 'var(--foreground)' },
]

const STATUSES: ReadonlyArray<{ key: string; cells: readonly React.ReactNode[] }> = [
  {
    key: 'not_started',
    cells: ['not_started', 'Nobody has looked at this address', 'Research the current occupant'],
  },
  {
    key: 'researching',
    cells: [
      'researching',
      'Identifying the occupant and contact information',
      'Fill in the occupant and contact fields',
    ],
  },
  {
    key: 'contacted',
    cells: [
      'contacted',
      'First outreach sent',
      <>
        Set <GuideCode>first_contact_date</GuideCode>, log the channel in the notes
      </>,
    ],
  },
  {
    key: 'awaiting_response',
    cells: [
      'awaiting_response',
      'Waiting on a reply',
      <>
        Set <GuideCode>next_follow_up_date</GuideCode>, roughly two weeks out
      </>,
    ],
  },
  {
    key: 'follow_up_needed',
    cells: [
      'follow_up_needed',
      'The follow-up date passed with no reply',
      'Send the follow-up, then re-date it',
    ],
  },
  {
    key: 'interested',
    cells: [
      'interested',
      'Positive response, not yet committed',
      'Send the plaque details, arrange the next step',
    ],
  },
  {
    key: 'approved',
    cells: ['approved', 'The occupant agreed to a plaque', 'Hand off to plaque production'],
  },
  {
    key: 'declined',
    cells: [
      'declined',
      'The occupant said no',
      'Log the reason in the notes. Do not contact them again',
    ],
  },
  {
    key: 'not_applicable',
    cells: [
      'not_applicable',
      'Building demolished, vacant, or no viable contact',
      'Log why, so nobody repeats the search',
    ],
  },
]

const RESEARCH_STEPS: readonly GuideStep[] = [
  {
    title: 'Find out who is there now',
    body: 'Look the address up on Google Maps or OpenStreetMap. Who occupies it today?',
  },
  {
    title: 'Describe the occupant',
    body: (
      <>
        Fill in <GuideCode>current_occupant_name</GuideCode>,{' '}
        <GuideCode>current_occupant_type</GuideCode> — business, residential, office, public, vacant
        or demolished — and <GuideCode>property_type</GuideCode>.
      </>
    ),
  },
  {
    title: 'Find a way to reach them',
    body: (
      <>
        <GuideCode>contact_email</GuideCode>, <GuideCode>contact_phone</GuideCode>,{' '}
        <GuideCode>contact_website</GuideCode>, and a named <GuideCode>contact_person</GuideCode>{' '}
        wherever one can be found.
      </>
    ),
  },
  {
    title: 'Record where it came from',
    body: (
      <>
        Set <GuideCode>data_source</GuideCode> to one of google_maps, osm, manual_research,
        site_visit, phone_call or website.
      </>
    ),
  },
  {
    title: 'Move the status',
    body: (
      <>
        <GuideCode>researching</GuideCode> while the record is incomplete,{' '}
        <GuideCode>contacted</GuideCode> once outreach has actually been sent.
      </>
    ),
  },
]

const CODE_LOCATIONS: ReadonlyArray<{ key: string; cells: readonly React.ReactNode[] }> = [
  {
    key: 'ui',
    cells: [
      'UI',
      <>
        <GuideCode>src/app/admin/outreach/page.tsx</GuideCode> and{' '}
        <GuideCode>src/app/components/outreach/</GuideCode>
      </>,
    ],
  },
  {
    key: 'api',
    cells: [
      'API',
      <>
        <GuideCode>src/app/api/outreach/</GuideCode> — data and CSV export
      </>,
    ],
  },
  {
    key: 'model',
    cells: ['Data model', <GuideCode key="c">src/lib/types/outreach.ts</GuideCode>],
  },
  {
    key: 'source',
    cells: [
      'Source list',
      <GuideCode key="c">Outreach/Jewish Business Outreach - For Json.csv</GuideCode>,
    ],
  },
]

const OutreachGuideContent: React.FC = () => (
  <>
    <div className="mb-4">
      <GuideCallout tone="critical" title="Before your first message">
        <p>
          Current occupants bear <strong>no responsibility</strong> for what happened at their
          address. Our tone is always invitational, never accusatory. A person who declines has
          declined — that answer is final and it is respected.
        </p>
      </GuideCallout>
    </div>

    <GuideSection
      id="the-pipeline"
      number="01"
      title="The pipeline"
      intro={
        <GuideLead>
          Every address moves through a status pipeline. Update the status{' '}
          <strong>every time</strong> you touch a record — the tracker is only useful if it reflects
          reality.
        </GuideLead>
      }
    >
      <div className="p-5 sm:p-6 space-y-5" style={guideBlockStyle('var(--accent-coral)')}>
        <div>
          <div
            className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--muted)' }}
          >
            The main path
          </div>
          <GuidePipeline stages={PIPELINE} />
        </div>
        <div>
          <div
            className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: 'var(--muted)' }}
          >
            Where it can branch off
          </div>
          <div className="flex flex-wrap gap-2">
            {BRANCHES.map((stage) => (
              <span
                key={stage.label}
                className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-2"
                style={{
                  backgroundColor: stage.bg,
                  color: stage.fg,
                  border: '2px solid var(--foreground)',
                }}
              >
                {stage.label}
              </span>
            ))}
          </div>
          <p
            className="font-['Inter'] text-sm leading-relaxed mt-3"
            style={{ color: 'var(--foreground-muted)' }}
          >
            An unanswered record falls back to follow-up needed and re-enters the path. Declined and
            not applicable are terminal.
          </p>
        </div>
      </div>

      <GuideTable
        columns={['Status', 'Means', 'Your next action']}
        rows={STATUSES}
        accent="var(--accent-purple)"
      />

      <GuideProse>
        <strong style={{ color: 'var(--foreground)' }}>Interest level</strong> —{' '}
        <GuideCode>high</GuideCode>, <GuideCode>medium</GuideCode>, <GuideCode>low</GuideCode>,{' '}
        <GuideCode>none</GuideCode>, <GuideCode>unknown</GuideCode> — is separate from status. Use
        it to prioritise follow-ups.
      </GuideProse>
    </GuideSection>

    <GuideSection
      id="research-workflow"
      number="02"
      title="Research workflow"
      intro={
        <GuideLead>
          Use <strong>Research Mode</strong> — the button in the tracker header — to step through{' '}
          <GuideCode>not_started</GuideCode> records one at a time. For each address:
        </GuideLead>
      }
    >
      <GuideSteps steps={RESEARCH_STEPS} accent="var(--accent-chartreuse)" />
    </GuideSection>

    <GuideSection id="contact-guidelines" number="03" title="Contact guidelines">
      <GuideBullets
        items={[
          <>
            <strong style={{ color: 'var(--foreground)' }}>Lead with the mission:</strong> memory,
            education, neighbourhood history.
          </>,
          <>
            <strong style={{ color: 'var(--foreground)' }}>Be concrete about the plaque:</strong>{' '}
            size, placement, and the cost to them — which is none.
          </>,
          <>
            <strong style={{ color: 'var(--foreground)' }}>Two follow-ups, then stop:</strong> one
            after about two weeks, a second after about four, and no more unless they respond.
          </>,
          <>
            <strong style={{ color: 'var(--foreground)' }}>Log every interaction</strong> in{' '}
            <GuideCode>outreach_notes</GuideCode>, with a date prefix.
          </>,
          <>
            <strong style={{ color: 'var(--foreground)' }}>A declined is final.</strong> Respect it.
          </>,
        ]}
      />
      <div className="p-5" style={guideBlockStyle('var(--accent-yellow)', 5)}>
        <div
          className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
          style={{ color: 'var(--muted)' }}
        >
          A note entry looks like this
        </div>
        <code
          className="font-mono text-[13px] leading-relaxed block"
          style={{ color: 'var(--foreground)' }}
        >
          2026-08-09: Called, spoke with office manager, sending info PDF.
        </code>
      </div>
    </GuideSection>

    <GuideSection id="data-hygiene" number="04" title="Data hygiene">
      <GuideBullets
        items={[
          <>
            Dates go in date fields in ISO format — <GuideCode>YYYY-MM-DD</GuideCode>.
          </>,
          'Notes are append-only. Never delete history; add new lines on top.',
          <>
            Export a CSV backup — the Export button, or <GuideCode>/api/outreach/export</GuideCode>{' '}
            — before any bulk edit.
          </>,
          'Never commit personal contact data to the public repo beyond what the tracker’s data store already holds.',
        ]}
      />
    </GuideSection>

    <GuideSection
      id="weekly-rhythm"
      number="05"
      title="Weekly rhythm"
      intro={
        <GuideLead>
          Small consistent batches beat heroic sprints. Five to ten addresses in a session is a good
          week.
        </GuideLead>
      }
    >
      <GuideSteps
        steps={[
          {
            title: 'Check the stats bar',
            body: (
              <>
                Open the tracker. The <GuideCode>follow_up_needed</GuideCode> count is your queue.
              </>
            ),
          },
          {
            title: 'Clear the follow-ups first',
            body: (
              <>
                Then continue research on <GuideCode>not_started</GuideCode> records.
              </>
            ),
          },
          {
            title: 'Report back',
            body: (
              <>
                Note blockers or interesting responses on the project task board — see the{' '}
                <Link href="/onboarding/tasks" style={{ color: 'var(--primary)' }}>
                  task tracking guide
                </Link>
                .
              </>
            ),
          },
        ]}
        accent="var(--accent-purple)"
      />
    </GuideSection>

    <GuideSection
      id="where-the-code-lives"
      number="06"
      title="Where the code lives"
      intro={
        <GuideLead>
          The tracker lives at <GuideCode>/admin/outreach</GuideCode>. Both the page and the
          underlying <GuideCode>/api/outreach</GuideCode> endpoints are password-gated server-side —
          ask the maintainer for access.
        </GuideLead>
      }
    >
      <GuideTable columns={['Piece', 'Path']} rows={CODE_LOCATIONS} accent="var(--accent-yellow)" />
    </GuideSection>
  </>
)

export default React.memo(OutreachGuideContent)
