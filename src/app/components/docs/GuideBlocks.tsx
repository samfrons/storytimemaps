import React from 'react'
import Link from 'next/link'

/**
 * The building blocks the contributor guides are written in.
 *
 * The guides used to be Markdown piped through a renderer, which gave a
 * historian or a teacher a wall of undifferentiated prose. Authoring them from
 * these blocks instead means a table reads as a table, a workflow reads as
 * steps, and the sensitivity rules read as something you cannot scroll past.
 *
 * The visual language is the site's brutal-pop family, dialled down: the same
 * thick rules, hard offset shadows and uppercase mono labels as /collaborate,
 * but with reading-page whitespace. Every colour is a theme variable, so the
 * pages hold up in all ten themes.
 */

export const GUIDE_BORDER = '3px solid var(--foreground)'

/** The accents a guide block may be tinted with, as theme variables. */
export type GuideAccent =
  | 'var(--primary)'
  | 'var(--accent-yellow)'
  | 'var(--accent-coral)'
  | 'var(--accent-purple)'
  | 'var(--accent-chartreuse)'
  | 'var(--accent-orange)'
  | 'var(--success)'
  | 'var(--warning)'
  | 'var(--danger)'

export function guideBlockStyle(accent: GuideAccent, offset = 6): React.CSSProperties {
  return {
    border: GUIDE_BORDER,
    boxShadow: `${offset}px ${offset}px 0 ${accent}`,
    backgroundColor: 'var(--card-bg)',
  }
}

/* ------------------------------------------------------------------ prose */

interface ChildrenProps {
  children: React.ReactNode
}

const Prose: React.FC<ChildrenProps & { className?: string }> = ({ children, className = '' }) => (
  <p
    className={`font-['Inter'] text-[15px] sm:text-base leading-relaxed max-w-3xl ${className}`}
    style={{ color: 'var(--foreground-muted)' }}
  >
    {children}
  </p>
)

export const GuideProse = React.memo(Prose)

const Lead: React.FC<ChildrenProps> = ({ children }) => (
  <p
    className="font-['Inter'] text-base sm:text-lg leading-relaxed max-w-3xl"
    style={{ color: 'var(--foreground)' }}
  >
    {children}
  </p>
)

export const GuideLead = React.memo(Lead)

/** Inline code, set in mono against a tinted field. */
const Code: React.FC<ChildrenProps> = ({ children }) => (
  <code
    className="font-mono text-[0.85em] px-1.5 py-0.5"
    style={{
      backgroundColor: 'rgba(var(--muted-rgb), 0.35)',
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
    }}
  >
    {children}
  </code>
)

export const GuideCode = React.memo(Code)

/* ---------------------------------------------------------------- section */

interface GuideSectionProps extends ChildrenProps {
  /** Anchor target, matching the table of contents entry. */
  id: string
  number?: string
  title: string
  intro?: React.ReactNode
}

const Section: React.FC<GuideSectionProps> = ({ id, number, title, intro, children }) => (
  <section id={id} className="scroll-mt-24 pt-14 sm:pt-16 first:pt-0">
    <div className="flex items-baseline gap-4 mb-5">
      {number && (
        <span
          className="font-mono text-xs font-bold px-2 py-1 shrink-0"
          style={{
            backgroundColor: 'var(--foreground)',
            color: 'var(--background)',
          }}
        >
          {number}
        </span>
      )}
      <h2
        className="font-mono font-bold uppercase text-xl sm:text-2xl leading-tight"
        style={{ color: 'var(--foreground)' }}
      >
        {title}
      </h2>
    </div>
    <div className="w-full h-[3px] mb-7" style={{ backgroundColor: 'var(--foreground)' }} />
    {intro && <div className="mb-8">{intro}</div>}
    <div className="space-y-6">{children}</div>
  </section>
)

export const GuideSection = React.memo(Section)

/* --------------------------------------------------------------- callout */

export type CalloutTone = 'critical' | 'warning' | 'note'

const CALLOUT_ACCENT: Record<CalloutTone, GuideAccent> = {
  critical: 'var(--accent-coral)',
  warning: 'var(--accent-yellow)',
  note: 'var(--accent-purple)',
}

interface CalloutProps extends ChildrenProps {
  tone?: CalloutTone
  title: string
}

const Callout: React.FC<CalloutProps> = ({ tone = 'note', title, children }) => {
  const accent = CALLOUT_ACCENT[tone]
  return (
    <aside className="p-5 sm:p-6" style={guideBlockStyle(accent)}>
      <div
        className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1 mb-4"
        style={{
          backgroundColor: accent,
          color: tone === 'warning' ? 'var(--declining-text)' : 'var(--active-text)',
          border: '2px solid var(--foreground)',
        }}
      >
        {title}
      </div>
      <div className="font-['Inter'] text-[15px] leading-relaxed space-y-3 max-w-3xl">
        {children}
      </div>
    </aside>
  )
}

export const GuideCallout = React.memo(Callout)

/* ----------------------------------------------------------------- table */

export interface GuideTableProps {
  caption?: string
  columns: readonly string[]
  rows: ReadonlyArray<{ key: string; cells: readonly React.ReactNode[] }>
  accent?: GuideAccent
}

const Table: React.FC<GuideTableProps> = ({
  caption,
  columns,
  rows,
  accent = 'var(--accent-purple)',
}) => (
  <figure style={guideBlockStyle(accent)}>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        {caption && (
          <caption
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-left px-5 pt-5 pb-3"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {caption}
          </caption>
        )}
        <thead>
          <tr style={{ backgroundColor: 'var(--foreground)' }}>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] px-4 py-3 whitespace-nowrap"
                style={{ color: 'var(--background)' }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} style={{ borderTop: '2px solid var(--border)' }}>
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.key}-${index}`}
                  className={`px-4 py-3.5 align-top text-sm leading-relaxed ${
                    index === 0 ? 'font-mono font-bold' : "font-['Inter']"
                  }`}
                  style={{
                    color: index === 0 ? 'var(--foreground)' : 'var(--foreground-muted)',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </figure>
)

export const GuideTable = React.memo(Table)

/* ----------------------------------------------------------------- steps */

export interface GuideStep {
  title: string
  body: React.ReactNode
}

const Steps: React.FC<{ steps: readonly GuideStep[]; accent?: GuideAccent }> = ({
  steps,
  accent = 'var(--accent-chartreuse)',
}) => (
  <ol className="space-y-4">
    {steps.map((step, index) => (
      <li key={step.title} className="flex gap-4 p-5" style={guideBlockStyle(accent, 5)}>
        <span
          className="font-mono font-bold text-lg w-10 h-10 flex items-center justify-center shrink-0"
          style={{
            backgroundColor: accent,
            color: 'var(--active-text)',
            border: '2px solid var(--foreground)',
          }}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <div className="min-w-0">
          <h3
            className="font-mono font-bold uppercase text-sm tracking-wide mb-2"
            style={{ color: 'var(--foreground)' }}
          >
            {step.title}
          </h3>
          <div
            className="font-['Inter'] text-[15px] leading-relaxed space-y-2"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {step.body}
          </div>
        </div>
      </li>
    ))}
  </ol>
)

export const GuideSteps = React.memo(Steps)

/* ---------------------------------------------------------------- bullets */

const Bullets: React.FC<{ items: readonly React.ReactNode[]; marker?: string }> = ({
  items,
  marker = '—',
}) => (
  <ul className="space-y-3 max-w-3xl">
    {items.map((item, index) => (
      <li key={index} className="flex gap-3">
        <span
          className="font-mono text-sm font-bold shrink-0 pt-0.5"
          style={{ color: 'var(--primary)' }}
          aria-hidden="true"
        >
          {marker}
        </span>
        <span
          className="font-['Inter'] text-[15px] leading-relaxed"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {item}
        </span>
      </li>
    ))}
  </ul>
)

export const GuideBullets = React.memo(Bullets)

/* ------------------------------------------------------------------ cards */

export interface GuideCard {
  kicker: string
  title: string
  body: React.ReactNode
  accent: GuideAccent
  href?: string
  linkLabel?: string
  external?: boolean
}

const Cards: React.FC<{ cards: readonly GuideCard[]; columns?: 2 | 3 }> = ({
  cards,
  columns = 2,
}) => (
  <div className={`grid gap-6 sm:gap-7 ${columns === 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}>
    {cards.map((card) => (
      <div
        key={card.title}
        className="p-5 sm:p-6 flex flex-col"
        style={guideBlockStyle(card.accent)}
      >
        <div
          className="inline-block self-start font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-1 mb-4"
          style={{
            backgroundColor: card.accent,
            color:
              card.accent === 'var(--accent-yellow)'
                ? 'var(--declining-text)'
                : 'var(--active-text)',
            border: '2px solid var(--foreground)',
          }}
        >
          {card.kicker}
        </div>
        <h3
          className="font-mono font-bold uppercase text-base mb-3"
          style={{ color: 'var(--foreground)' }}
        >
          {card.title}
        </h3>
        <div
          className="font-['Inter'] text-[15px] leading-relaxed flex-1"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {card.body}
        </div>
        {card.href && card.linkLabel && (
          <div className="pt-5">
            {card.external ? (
              <a
                href={card.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-block font-mono text-[11px] font-bold uppercase tracking-wider px-4 py-2 transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)',
                  outline: 'none',
                  boxShadow: `4px 4px 0 ${card.accent}`,
                }}
              >
                {card.linkLabel} ↗
              </a>
            ) : (
              <Link
                href={card.href}
                className="inline-block font-mono text-[11px] font-bold uppercase tracking-wider px-4 py-2 transition-transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: 'var(--foreground)',
                  color: 'var(--background)',
                  outline: 'none',
                  boxShadow: `4px 4px 0 ${card.accent}`,
                }}
              >
                {card.linkLabel} →
              </Link>
            )}
          </div>
        )}
      </div>
    ))}
  </div>
)

export const GuideCards = React.memo(Cards)

/* ------------------------------------------------------------- code block */

const CodeBlock: React.FC<{ label?: string; code: string }> = ({ label, code }) => (
  <div style={guideBlockStyle('var(--accent-purple)', 5)}>
    {label && (
      <div
        className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2"
        style={{
          backgroundColor: 'var(--foreground)',
          color: 'var(--background)',
        }}
      >
        {label}
      </div>
    )}
    <pre className="overflow-x-auto p-4 sm:p-5">
      <code
        className="font-mono text-[12.5px] leading-relaxed whitespace-pre"
        style={{ color: 'var(--foreground)' }}
      >
        {code}
      </code>
    </pre>
  </div>
)

export const GuideCodeBlock = React.memo(CodeBlock)

/* ---------------------------------------------------------------- pipeline */

export interface PipelineStage {
  label: string
  bg: string
  fg: string
}

const Pipeline: React.FC<{ stages: readonly PipelineStage[] }> = ({ stages }) => (
  <div className="flex flex-wrap items-center gap-2">
    {stages.map((stage, index) => (
      <React.Fragment key={stage.label}>
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-2"
          style={{
            backgroundColor: stage.bg,
            color: stage.fg,
            border: '2px solid var(--foreground)',
          }}
        >
          {stage.label}
        </span>
        {index < stages.length - 1 && (
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
)

export const GuidePipeline = React.memo(Pipeline)

/* -------------------------------------------------------------- checklist */

const Checklist: React.FC<{ items: readonly React.ReactNode[]; title?: string }> = ({
  items,
  title,
}) => (
  <div className="p-5 sm:p-6" style={guideBlockStyle('var(--accent-chartreuse)')}>
    {title && (
      <h3
        className="font-mono font-bold uppercase text-sm tracking-wide mb-4"
        style={{ color: 'var(--foreground)' }}
      >
        {title}
      </h3>
    )}
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 items-start">
          <span
            className="w-4 h-4 shrink-0 mt-1"
            style={{ border: '2px solid var(--foreground)' }}
            aria-hidden="true"
          />
          <span
            className="font-['Inter'] text-[15px] leading-relaxed"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  </div>
)

export const GuideChecklist = React.memo(Checklist)
