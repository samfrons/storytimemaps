// file: src/app/components/map/MapLegend.tsx

'use client'

import React, { useMemo, useState } from 'react'
import type { StoryMap } from '../../../types'
import { POSTWAR_ERA_START } from '../../../hooks/useStoryMapLogicTest'
import { useTranslation } from '../../../i18n/useTranslation'
import { getThemeMarkerColors } from '../../../utils/mapStyles'
import {
  ALL_CATEGORIES,
  UNCATEGORISED,
  mainBranchLabel,
  mainFilterValue,
  sectorFilterValue,
  sectorLabel,
  tallyCategories,
} from '../../../utils/businessSectors'

interface MapLegendProps {
  /**
   * Current year on the time slider. The postwar "standing today" state only exists from 1945,
   * so its swatch is hidden before then rather than listing a state that cannot occur.
   */
  currentYear?: number
  /** Stories currently on the map — the counts are computed over these. */
  stories: Partial<StoryMap>[]
  theme?: string
  selectedCategory: string
  onSelectCategory: (value: string) => void
}

/**
 * Two things the map never explained: what the marker colours mean, and how
 * the businesses break down by sector.
 *
 * Markers are coloured by TEMPORAL STATE (active/declining/closed/future), not
 * by category, so section A is the real colour key and section B is a
 * clickable breakdown rather than a second set of swatches. Clicking a row
 * drives the same filter state as the sidebar dropdown.
 */
const MapLegend: React.FC<MapLegendProps> = ({
  stories,
  theme,
  selectedCategory,
  onSelectCategory,
  currentYear,
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(true)
  const [showSectors, setShowSectors] = useState(false)

  // Colours must come from the shared theme function — there are 10+ themes
  // and any inline hex would be wrong on all but one of them.
  const colors = useMemo(() => getThemeMarkerColors(theme), [theme])
  const tally = useMemo(() => tallyCategories(stories), [stories])

  const branches = useMemo(
    () =>
      Array.from(tally.mains.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([branch, count]) => ({
          value: mainFilterValue(branch),
          label: mainBranchLabel(t, branch),
          count,
        })),
    [tally, t]
  )

  const sectors = useMemo(
    () =>
      Array.from(tally.sectors.entries())
        .map(([key, entry]) => ({
          value: sectorFilterValue(key),
          label: sectorLabel(t, key, entry.rawLabel),
          count: entry.count,
        }))
        .sort((a, b) => b.count - a.count),
    [tally, t]
  )

  const states: Array<{ key: 'active' | 'declining' | 'closed' | 'future' | 'standing' }> = [
    { key: 'active' },
    { key: 'declining' },
    { key: 'closed' },
    { key: 'future' },
    ...(currentYear != null && currentYear >= POSTWAR_ERA_START
      ? [{ key: 'standing' as const }]
      : []),
  ]

  const heading = (label: string) => (
    <div
      className="text-[10px] font-mono uppercase tracking-wider mb-1.5"
      style={{ color: 'var(--foreground-muted)' }}
      aria-hidden="true"
    >
      {label}
    </div>
  )

  const row = (value: string, label: string, count: number) => {
    const isActive = selectedCategory === value
    return (
      <button
        key={value}
        onClick={() => onSelectCategory(isActive ? ALL_CATEGORIES : value)}
        className={`w-full text-left text-[11px] font-mono py-1 pr-1 flex items-center justify-between gap-3 transition-colors focus:outline-none ${
          isActive ? 'border-l-2 pl-1.5' : 'pl-2'
        }`}
        style={{
          color: isActive ? 'var(--primary)' : 'var(--foreground)',
          borderLeftColor: isActive ? 'var(--primary)' : 'transparent',
          backgroundColor: isActive ? 'var(--border)' : 'transparent',
        }}
        aria-pressed={isActive}
      >
        <span className="truncate">{label}</span>
        <span style={{ color: 'var(--foreground-muted)' }}>{count.toLocaleString()}</span>
      </button>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 border shadow-sm transition-all duration-200 focus:outline-none hover:scale-110"
        style={{
          backgroundColor: 'rgba(var(--muted-rgb), 0.8)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)',
          cursor: 'pointer',
        }}
        aria-label={t('mainPage.mapLegend.title')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      </button>
    )
  }

  return (
    <div
      className="border shadow-sm backdrop-blur-sm w-56 max-h-[60vh] overflow-y-auto"
      style={{
        backgroundColor: 'rgba(var(--muted-rgb), 0.9)',
        borderColor: 'var(--border)',
        color: 'var(--foreground)',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderBottomColor: 'var(--border)' }}
      >
        <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
          {t('mainPage.mapLegend.title')}
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs font-mono focus:outline-none"
          style={{ color: 'var(--foreground-muted)', cursor: 'pointer' }}
          aria-label={t('mainPage.mapLegend.title')}
        >
          ×
        </button>
      </div>

      <div className="px-3 py-2.5">
        {heading(t('mainPage.mapLegend.markerStates'))}
        {states.map(({ key }) => (
          <div key={key} className="flex items-center gap-2 py-0.5 pl-2">
            <span
              className="inline-block w-2.5 h-2.5 shrink-0"
              style={{ backgroundColor: colors[key] }}
            />
            <span className="text-[11px] font-mono">{t(`mainPage.mapLegend.${key}`)}</span>
          </div>
        ))}
      </div>

      <div className="px-3 pb-2.5">
        {heading(t('mainPage.mapLegend.categories'))}
        {branches.map((b) => row(b.value, b.label, b.count))}
        {tally.uncategorised > 0 &&
          row(UNCATEGORISED, t('mainPage.storyList.uncategorized'), tally.uncategorised)}

        {sectors.length > 0 && (
          <>
            <button
              onClick={() => setShowSectors((v) => !v)}
              className="w-full text-left text-[10px] font-mono uppercase tracking-wider mt-2 pl-2 py-1 focus:outline-none"
              style={{ color: 'var(--foreground-muted)', cursor: 'pointer' }}
              aria-expanded={showSectors}
            >
              {showSectors ? '▾ ' : '▸ '}
              {t('mainPage.mapLegend.showAllSectors')}
            </button>
            {showSectors && sectors.map((s) => row(s.value, s.label, s.count))}
          </>
        )}
      </div>
    </div>
  )
}

export default React.memo(MapLegend)
