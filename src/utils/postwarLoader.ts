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
  /**
   * building-kind periods only: does the quoted statement describe the site being IN USE, or
   * destroyed / demolished / not rebuilt / at a different address?
   *
   * This distinction is the difference between "Soho House stands here" and "the college was
   * destroyed by bombing" - both are `kind: 'building'`, and treating them alike would paint a
   * bombed-out site as standing today. Only `true` colours a pin on the map.
   */
  siteInUse?: boolean
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

/** Every site keyed by story id, including those with no postwar data. */
export const loadAllPostwarSites = async (): Promise<Record<string, PostwarSite>> => {
  const file = await loadFile()
  return file?.sites ?? {}
}

/**
 * Is this address documented as being in some known use during `year`?
 *
 * Deliberately conservative, because the alternative is inventing occupancy history:
 *  - only `building` periods count. A firm surviving in another city, or a family receiving
 *    compensation, says nothing about what stands at the address.
 *  - a period only covers a year if the SOURCE gave a start year. Five building periods are
 *    undated ("in the mid-1990s the property was restored") and are shown in the modal but
 *    never used to colour a pin at a specific date.
 *  - a `currentOccupant` counts only at the present-day end of the timeline, because that
 *    record is a statement about today and about nothing else.
 */
export const isSiteDocumentedInYear = (
  site: PostwarSite | undefined,
  year: number,
  presentDayYear: number
): boolean => {
  if (!site) return false

  const datedBuildingPeriod = site.periods.some(
    (p) =>
      p.kind === 'building' &&
      p.siteInUse === true &&
      p.startYear != null &&
      p.startYear <= year &&
      (p.endYear == null || p.endYear >= year)
  )
  if (datedBuildingPeriod) return true

  // A current occupant is a statement about today - but "Vacant" and bare property descriptions
  // ("Residential/Office Building") describe a plot, not a documented occupier, so they do not
  // earn a pin.
  const occupant = site.currentOccupant?.name ?? ''
  const occupantIsRealTenant =
    occupant.length > 0 && !/^vacant\b/i.test(occupant) && !/^residential\/office/i.test(occupant)

  return occupantIsRealTenant && year >= presentDayYear
}

/** Year bounds the GL dot expression uses. 9999 is the never-matches sentinel, matching midYear. */
export const postwarBoundsForSite = (
  site: PostwarSite | undefined,
  presentDayYear: number
): { from: number; to: number } => {
  const NEVER = 9999
  if (!site) return { from: NEVER, to: NEVER }

  const usable = site.periods.filter(
    (p) => p.kind === 'building' && p.siteInUse === true && p.startYear != null
  )

  if (usable.length > 0) {
    const from = Math.min(...usable.map((p) => p.startYear as number))
    // A null endYear means the source gave no end, i.e. it still held when the chapter was
    // written - so the range stays open rather than being closed at an invented year.
    const to = usable.some((p) => p.endYear == null)
      ? NEVER
      : Math.max(...usable.map((p) => p.endYear as number))
    return { from, to }
  }

  const occupant = site.currentOccupant?.name ?? ''
  const occupantIsRealTenant =
    occupant.length > 0 && !/^vacant\b/i.test(occupant) && !/^residential\/office/i.test(occupant)
  if (occupantIsRealTenant) return { from: presentDayYear, to: NEVER }

  return { from: NEVER, to: NEVER }
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
