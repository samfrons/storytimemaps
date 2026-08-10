/**
 * The HU Berlin business taxonomy, as it reaches the UI.
 *
 * The source database classifies each company twice: a Hauptbranche (one of
 * four broad branches) and a Branche (one of 25 detailed sectors). Both are
 * written onto our records by scripts/recover_branch_fields_2026.py as
 * `mainBranch` and `sectorKey`; SECTOR_KEYS below MUST stay in step with the
 * `_SECTORS` table in that script.
 *
 * Why slugs and not the source labels: the source emits some sectors in
 * English and some in German, and translation keys are resolved by splitting
 * on "." (src/i18n/useTranslationNew.ts), so a label like
 * "machines, motor vehicles & technical articles" cannot be a key.
 */

import type { StoryMap } from '@/types'

type TFunction = (key: string, options?: Record<string, unknown>) => string

export const MAIN_BRANCHES = ['trade', 'industry', 'services', 'handicraft'] as const
export type MainBranch = (typeof MAIN_BRANCHES)[number]

/** Alphabetical by English label — the order the dropdown falls back to. */
export const SECTOR_KEYS = [
  'ADVERTISING',
  'BANKS_AND_INSURANCE',
  'BOOKS_AND_ART',
  'CHEMICALS_AND_PHARMACEUTICALS',
  'CONSTRUCTION',
  'CONSTRUCTION_MATERIALS_AND_FUEL',
  'DEPARTMENT_STORES',
  'ELECTRICAL_GOODS',
  'FOOD_AND_BEVERAGES',
  'FURNITURE',
  'HOUSEHOLD_GOODS',
  'JEWELRY_AND_PRECIOUS_METALS',
  'LEATHER_AND_SHOES',
  'MACHINES_AND_VEHICLES',
  'METALS_AND_METAL_GOODS',
  'OTHER',
  'PAPER_AND_PAPER_GOODS',
  'PHARMACIES',
  'PHOTOGRAPHY_AND_FILM',
  'PUBLISHING_AND_PRINTING',
  'REAL_ESTATE',
  'RESTAURANTS',
  'TEXTILES_AND_CLOTHING',
  'TRANSPORTATION',
  'USED_GOODS',
] as const
export type SectorKey = (typeof SECTOR_KEYS)[number]

/** Filter value for records the source never classified. */
export const UNCATEGORISED = '__none__'
export const ALL_CATEGORIES = 'all'

const SECTOR_PREFIX = 'sector:'
const MAIN_PREFIX = 'main:'

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------
// t() returns the key path itself when a key is missing, so "did it resolve?"
// is a string comparison against the path — the same idiom the rest of the app
// uses. On a miss we fall back to the raw source label rather than showing a
// translation key to the user.

export function sectorLabel(t: TFunction, sectorKey?: string, rawLabel?: string): string {
  if (!sectorKey) return rawLabel ?? ''
  const path = `mainPage.businessSectors.${sectorKey}`
  const translated = t(path)
  return translated !== path ? translated : (rawLabel ?? sectorKey)
}

export function mainBranchLabel(t: TFunction, mainBranch?: string): string {
  if (!mainBranch) return ''
  const path = `mainPage.mainBranches.${mainBranch.toUpperCase()}`
  const translated = t(path)
  return translated !== path ? translated : mainBranch
}

/** The label to show for a record: its sector, else its broad branch, else nothing. */
export function storyCategoryLabel(t: TFunction, story: Partial<StoryMap>): string {
  return sectorLabel(t, story.sectorKey, story.businessType) || mainBranchLabel(t, story.mainBranch)
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export type ParsedFilter =
  | { kind: 'all' }
  | { kind: 'main'; value: string }
  | { kind: 'sector'; value: string }
  | { kind: 'none' }

export function parseFilter(value: string): ParsedFilter {
  if (!value || value === ALL_CATEGORIES) return { kind: 'all' }
  if (value === UNCATEGORISED) return { kind: 'none' }
  if (value.startsWith(MAIN_PREFIX)) return { kind: 'main', value: value.slice(MAIN_PREFIX.length) }
  if (value.startsWith(SECTOR_PREFIX))
    return { kind: 'sector', value: value.slice(SECTOR_PREFIX.length) }
  // Bare value: a legacy/bookmarked filter. Treat it as a sector key.
  return { kind: 'sector', value }
}

export const mainFilterValue = (branch: string) => `${MAIN_PREFIX}${branch}`
export const sectorFilterValue = (key: string) => `${SECTOR_PREFIX}${key}`

export function matchesFilter(story: Partial<StoryMap>, filter: string): boolean {
  const parsed = parseFilter(filter)
  switch (parsed.kind) {
    case 'all':
      return true
    // The 768 records the source left unclassified. Without an explicit bucket
    // they are unreachable through the UI, which is the bug this replaces.
    case 'none':
      return !story.sectorKey && !story.mainBranch
    case 'main':
      return story.mainBranch === parsed.value
    case 'sector':
      return story.sectorKey === parsed.value
  }
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export interface SectorTally {
  count: number
  /** Dominant main branch for this sector, derived from the data. */
  mainBranch?: string
  /** Raw source label, kept as the fallback when a translation is missing. */
  rawLabel?: string
}

export interface CategoryTally {
  mains: Map<string, number>
  sectors: Map<string, SectorTally>
  uncategorised: number
}

/**
 * Count branches and sectors over a set of stories.
 *
 * The sector -> branch grouping is derived here rather than hardcoded: a
 * sector legitimately spans branches (textiles and clothing appears under
 * Trade, Industry, Handicraft AND Services), so the grouping is "whichever
 * branch this sector most often appears under" and a static table would rot.
 */
export function tallyCategories(stories: Partial<StoryMap>[]): CategoryTally {
  const mains = new Map<string, number>()
  const sectors = new Map<string, SectorTally>()
  const branchVotes = new Map<string, Map<string, number>>()
  let uncategorised = 0

  for (const story of stories) {
    const { mainBranch, sectorKey, businessType } = story

    if (mainBranch) mains.set(mainBranch, (mains.get(mainBranch) ?? 0) + 1)

    if (sectorKey) {
      const entry = sectors.get(sectorKey) ?? { count: 0, rawLabel: businessType }
      entry.count += 1
      if (!entry.rawLabel && businessType) entry.rawLabel = businessType
      sectors.set(sectorKey, entry)

      if (mainBranch) {
        const votes = branchVotes.get(sectorKey) ?? new Map<string, number>()
        votes.set(mainBranch, (votes.get(mainBranch) ?? 0) + 1)
        branchVotes.set(sectorKey, votes)
      }
    }

    if (!sectorKey && !mainBranch) uncategorised += 1
  }

  for (const [key, votes] of branchVotes) {
    let winner: string | undefined
    let best = 0
    for (const [branch, n] of votes) {
      if (n > best) {
        best = n
        winner = branch
      }
    }
    const entry = sectors.get(key)
    if (entry) entry.mainBranch = winner
  }

  return { mains, sectors, uncategorised }
}
