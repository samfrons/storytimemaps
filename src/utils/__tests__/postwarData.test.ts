import fs from 'fs'
import path from 'path'
import { isSiteDocumentedInYear, type PostwarSite } from '../postwarLoader'

/**
 * Integrity checks on the SHIPPED postwar dataset, not on mocked input.
 *
 * public/data/postwar/sites.json is an extraction: every period carries a `sourceQuote` copied
 * verbatim out of that business's "Final Sale" catalogue chapter. Nothing in it is inferred.
 * These tests are the thing that keeps it that way - a well-meaning edit that paraphrases a
 * quote, invents a year, or flips a destruction record to in-use would otherwise ship silently
 * and the map would start making false claims about real addresses.
 */

const repoRoot = path.join(__dirname, '..', '..', '..')

const sitesFile = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'public', 'data', 'postwar', 'sites.json'), 'utf8')
) as { _meta?: Record<string, unknown>; sites: Record<string, PostwarSite> }

const storymaps = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'data', 'storymaps.json'), 'utf8')
) as Array<{ id: string; title: string; longDescription: string | null }>

// First occurrence wins, matching the app's own lookup order.
const chapterById = new Map<string, string>()
for (const s of storymaps) {
  if (!chapterById.has(String(s.id))) chapterById.set(String(s.id), s.longDescription ?? '')
}

const sites = Object.values(sitesFile.sites)
const allPeriods = sites.flatMap((s) => s.periods.map((p) => ({ site: s, period: p })))
const buildingPeriods = allPeriods.filter(({ period }) => period.kind === 'building')

/** Labels that describe destruction or absence rather than occupancy. */
const DESTRUCTION = /\b(destroyed|demolished|not rebuilt|different address|bombing)\b/i

describe('postwar dataset integrity', () => {
  it('covers all 16 featured stories', () => {
    expect(Object.keys(sitesFile.sites)).toHaveLength(16)
  })

  it('has no duplicate story ids in storymaps.json shadowing a featured record', () => {
    const seen = new Set<string>()
    const dupes = storymaps.filter((s) => {
      const k = String(s.id)
      if (seen.has(k)) return true
      seen.add(k)
      return false
    })
    expect(dupes.map((d) => d.id)).toEqual([])
  })

  // The load-bearing guarantee: the dataset quotes its sources rather than paraphrasing them.
  it('every sourceQuote appears verbatim in that story’s chapter', () => {
    const broken = allPeriods
      .filter(({ site, period }) => {
        const chapter = chapterById.get(site.storyId) ?? ''
        return !period.sourceQuote || !chapter.includes(period.sourceQuote)
      })
      .map(({ site, period }) => `#${site.storyId} "${period.label}"`)

    expect(broken).toEqual([])
  })

  it('gives every building period an explicit siteInUse verdict', () => {
    const missing = buildingPeriods
      .filter(({ period }) => typeof period.siteInUse !== 'boolean')
      .map(({ site, period }) => `#${site.storyId} "${period.label}"`)

    expect(missing).toEqual([])
  })

  // The specific mistake this whole classification layer exists to prevent.
  it('never marks a destruction record as the site being in use', () => {
    const contradictions = buildingPeriods
      .filter(({ period }) => period.siteInUse === true && DESTRUCTION.test(period.label))
      .map(({ site, period }) => `#${site.storyId} "${period.label}"`)

    expect(contradictions).toEqual([])
  })

  it('states a year only where the source gives one', () => {
    const invented = allPeriods
      .filter(({ period }) => {
        if (period.startYear == null) return false
        // A stated start year should be traceable to the quote, or explained in yearNote
        // (e.g. "in the 1950s" -> 1950, which is a documented decade-start convention).
        return !period.sourceQuote.includes(String(period.startYear)) && !period.yearNote
      })
      .map(({ site, period }) => `#${site.storyId} ${period.startYear} "${period.label}"`)

    expect(invented).toEqual([])
  })

  it('keeps years within the archive’s plausible range', () => {
    for (const { period } of allPeriods) {
      if (period.startYear != null) {
        expect(period.startYear).toBeGreaterThanOrEqual(1900)
        expect(period.startYear).toBeLessThanOrEqual(2025)
      }
      if (period.endYear != null) {
        expect(period.endYear).toBeGreaterThanOrEqual(1900)
        expect(period.endYear).toBeLessThanOrEqual(2025)
        if (period.startYear != null)
          expect(period.endYear).toBeGreaterThanOrEqual(period.startYear)
      }
    }
  })

  it('marks a site hasPostwarData only when it actually carries something', () => {
    for (const s of sites) {
      const hasContent = s.periods.length > 0 || s.currentOccupant != null
      expect(s.hasPostwarData).toBe(hasContent)
    }
  })
})

describe('what the map will actually claim', () => {
  const PRESENT = 2025
  const standingAt = (year: number) =>
    sites
      .filter((s) => isSiteDocumentedInYear(s, year, PRESENT))
      .map((s) => s.storyId)
      .sort((a, b) => Number(a) - Number(b))

  // Wartime must stay untouched by the postwar layer.
  it('claims nothing is standing before the war ends', () => {
    for (const year of [1920, 1933, 1938, 1944]) {
      expect(standingAt(year)).toEqual([])
    }
  })

  it('matches the reviewed set of documented addresses', () => {
    // Reviewed against the quoted sources. Changing these numbers means the map is making a
    // different historical claim, so this assertion should only ever be updated deliberately.
    expect(standingAt(1945)).toEqual(['4', '9'])
    expect(standingAt(1950)).toEqual(['3', '9', '10'])
    expect(standingAt(1990)).toEqual(['3', '9', '10'])
    expect(standingAt(2025)).toEqual(['3', '9', '10', '14', '16'])
  })

  it('excludes the bombed, demolished and vacant sites at every year', () => {
    // 11 destroyed by bombing, 12 demolished, 1 never rebuilt, 15 vacant.
    for (const year of [1945, 1950, 1971, 1990, 2025]) {
      const standing = standingAt(year)
      for (const excluded of ['1', '11', '12', '15']) {
        expect(standing).not.toContain(excluded)
      }
    }
  })
})
