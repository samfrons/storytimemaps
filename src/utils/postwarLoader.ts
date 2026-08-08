/**
 * Loads the post-1945 site data served from /data/postwar/sites.json.
 *
 * That file is EXTRACTED, not authored: every period carries a `sourceQuote` copied verbatim
 * out of the business's "Final Sale" catalog chapter, and `currentOccupant` comes only from the
 * outreach records. Nothing in it is inferred. Treat it as quotable provenance, not as prose to
 * be embellished in the UI.
 */

export type PostwarPeriodKind = 'building' | 'company' | 'family' | 'other'

export interface PostwarPeriod {
  label: string
  kind: PostwarPeriodKind
  startYear: number | null
  endYear: number | null
  summary: string
  sourceQuote: string
  sourceField: string
  yearNote?: string | null
}

export interface PostwarCurrentOccupant {
  name: string
  type?: string | null
  propertyType?: string | null
  sourceField?: string
}

export interface PostwarSite {
  storyId: string
  title: string
  address?: string
  hasPostwarData: boolean
  periods: PostwarPeriod[]
  currentOccupant: PostwarCurrentOccupant | null
  confidence?: string
  notes?: string
}

interface PostwarFile {
  _meta?: Record<string, unknown>
  sites: Record<string, PostwarSite>
}

// One fetch per session, shared by every modal that opens. The file is ~36KB.
let cache: Promise<PostwarFile | null> | null = null

const loadFile = (): Promise<PostwarFile | null> => {
  if (cache) return cache
  cache = fetch('/data/postwar/sites.json')
    .then((res) => (res.ok ? (res.json() as Promise<PostwarFile>) : null))
    .catch(() => null)
  return cache
}

export const loadPostwarSite = async (storyId: string): Promise<PostwarSite | null> => {
  const file = await loadFile()
  const site = file?.sites?.[storyId]
  if (!site || !site.hasPostwarData) return null
  return site
}

/** "1945-1990", "1945-", "-1971", or "" when the source gave no year at all. */
export const formatPostwarYears = (period: PostwarPeriod): string => {
  const { startYear, endYear } = period
  if (startYear && endYear)
    return startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`
  if (startYear) return `${startYear}–`
  if (endYear) return `–${endYear}`
  return ''
}
