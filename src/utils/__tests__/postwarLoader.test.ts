import {
  isSiteDocumentedInYear,
  postwarBoundsForSite,
  formatPostwarYears,
  type PostwarSite,
  type PostwarPeriod,
} from '../postwarLoader'

/**
 * These functions decide which addresses the map reports as still standing after 1945.
 *
 * The failure mode they exist to prevent is not a crash - it is the map quietly asserting that
 * a building destroyed by bombing, or demolished, or never rebuilt, is standing today. That is
 * a false historical claim in a memorial archive, so the cases below are deliberately weighted
 * towards proving the negative.
 */

const PRESENT = 2025

const period = (over: Partial<PostwarPeriod> = {}): PostwarPeriod => ({
  label: 'test period',
  kind: 'building',
  startYear: null,
  endYear: null,
  summary: 'summary',
  sourceQuote: 'quote',
  sourceField: 'storymaps.longDescription',
  ...over,
})

const site = (over: Partial<PostwarSite> = {}): PostwarSite => ({
  storyId: '1',
  title: 'Test business',
  hasPostwarData: true,
  periods: [],
  currentOccupant: null,
  ...over,
})

describe('isSiteDocumentedInYear', () => {
  it('reports a site standing while a dated, in-use building period covers the year', () => {
    const s = site({
      periods: [period({ siteInUse: true, startYear: 1945, endYear: null })],
    })
    expect(isSiteDocumentedInYear(s, 1945, PRESENT)).toBe(true)
    expect(isSiteDocumentedInYear(s, 1990, PRESENT)).toBe(true)
    expect(isSiteDocumentedInYear(s, 1944, PRESENT)).toBe(false)
  })

  it('closes the window at endYear rather than running to the present', () => {
    const s = site({
      periods: [period({ siteInUse: true, startYear: 1945, endYear: 1949 })],
    })
    expect(isSiteDocumentedInYear(s, 1949, PRESENT)).toBe(true)
    expect(isSiteDocumentedInYear(s, 1950, PRESENT)).toBe(false)
  })

  // The core safety property. `kind: 'building'` covers destruction as well as occupancy.
  it('never reports a destroyed, demolished or unbuilt site as standing', () => {
    for (const label of [
      'College building destroyed by bombing (wartime)',
      'Factory and family residence demolished',
      'Berlin store premises not rebuilt',
    ]) {
      const s = site({
        periods: [period({ label, siteInUse: false, startYear: 1943, endYear: null })],
      })
      expect(isSiteDocumentedInYear(s, 1950, PRESENT)).toBe(false)
      expect(isSiteDocumentedInYear(s, PRESENT, PRESENT)).toBe(false)
    }
  })

  it('ignores building periods that have no siteInUse verdict at all', () => {
    const s = site({ periods: [period({ startYear: 1945 })] })
    expect(isSiteDocumentedInYear(s, 1950, PRESENT)).toBe(false)
  })

  it('ignores company and family periods, which say nothing about the address', () => {
    const s = site({
      periods: [
        period({ kind: 'company', siteInUse: true, startYear: 1945 }),
        period({ kind: 'family', siteInUse: true, startYear: 1945 }),
      ],
    })
    expect(isSiteDocumentedInYear(s, 1950, PRESENT)).toBe(false)
  })

  it('will not date an undated building period', () => {
    const s = site({ periods: [period({ siteInUse: true, startYear: null })] })
    expect(isSiteDocumentedInYear(s, 1950, PRESENT)).toBe(false)
  })

  it('counts a real current occupant, but only at the present day', () => {
    const s = site({ currentOccupant: { name: 'Deutsches Theater Berlin' } })
    expect(isSiteDocumentedInYear(s, PRESENT, PRESENT)).toBe(true)
    expect(isSiteDocumentedInYear(s, 1960, PRESENT)).toBe(false)
  })

  it('rejects placeholder occupants that describe a plot rather than an occupier', () => {
    for (const name of ['Vacant (Former Hotel Bogota)', 'Residential/Office Building']) {
      const s = site({ currentOccupant: { name } })
      expect(isSiteDocumentedInYear(s, PRESENT, PRESENT)).toBe(false)
    }
  })

  it('returns false for an unknown site', () => {
    expect(isSiteDocumentedInYear(undefined, PRESENT, PRESENT)).toBe(false)
  })
})

describe('postwarBoundsForSite', () => {
  const NEVER = 9999

  it('spans the earliest start to the latest end across usable periods', () => {
    const s = site({
      periods: [
        period({ siteInUse: true, startYear: 1950, endYear: 1960 }),
        period({ siteInUse: true, startYear: 1971, endYear: 1980 }),
      ],
    })
    expect(postwarBoundsForSite(s, PRESENT)).toEqual({ from: 1950, to: 1980 })
  })

  it('keeps the window open when any period has no stated end', () => {
    const s = site({
      periods: [
        period({ siteInUse: true, startYear: 1945, endYear: 1990 }),
        period({ siteInUse: true, startYear: 2007, endYear: null }),
      ],
    })
    expect(postwarBoundsForSite(s, PRESENT)).toEqual({ from: 1945, to: NEVER })
  })

  it('falls back to the present day when only a current occupant is known', () => {
    const s = site({ currentOccupant: { name: 'Galeries Lafayette Berlin' } })
    expect(postwarBoundsForSite(s, PRESENT)).toEqual({ from: PRESENT, to: NEVER })
  })

  it('returns the never-matches sentinel when nothing is documented', () => {
    expect(postwarBoundsForSite(site(), PRESENT)).toEqual({ from: NEVER, to: NEVER })
    expect(postwarBoundsForSite(undefined, PRESENT)).toEqual({ from: NEVER, to: NEVER })
  })

  // The sentinel is what the Mapbox expression compares against; if it ever became a real year
  // every undocumented address on the map would light up as standing.
  it('never produces a sentinel that a plausible slider year could satisfy', () => {
    const { from } = postwarBoundsForSite(site(), PRESENT)
    expect(from).toBeGreaterThan(PRESENT)
  })
})

describe('formatPostwarYears', () => {
  it.each([
    [{ startYear: 1945, endYear: 1990 }, '1945–1990'],
    [{ startYear: 1945, endYear: null }, '1945–'],
    [{ startYear: null, endYear: 1971 }, '–1971'],
    [{ startYear: 1950, endYear: 1950 }, '1950'],
    [{ startYear: null, endYear: null }, ''],
  ])('formats %j as "%s"', (years, expected) => {
    expect(formatPostwarYears(period(years))).toBe(expected)
  })
})
