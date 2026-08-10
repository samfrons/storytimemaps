import { getThemeMarkerColors, isCustomStyleTheme, isModificationTheme } from '../mapStyles'

/**
 * The marker palette is the visualisation. Every business on this map is a coloured dot, and the
 * whole point is that the shift from active through declining to closed reads as a mass across
 * the 1930s. A theme that silently loses a state, or renders two states the same colour, breaks
 * the reading without breaking the build.
 *
 * Theme identity is duplicated across a dozen hand-maintained lists in this codebase, so a new
 * theme genuinely does get added with one of them forgotten - `hoefe` shipped that way. These
 * tests are cheap insurance against the next one.
 */

const THEMES = [
  'moody',
  'cool',
  'warm',
  'hot',
  'cold',
  'bauhaus',
  'art-nouveau',
  'archival',
  'hoefe',
  'brutal-pop',
] as const

const STATES = ['active', 'declining', 'closed', 'future', 'standing'] as const

/** Approximate page/map background per theme, for the contrast sanity check below. */
const BACKGROUNDS: Record<string, string> = {
  moody: '#4a4a57',
  cool: '#f0f4f8',
  warm: '#f4f1e8',
  hot: '#e4525e',
  cold: '#e8f4f8',
  bauhaus: '#f5f5f0',
  'art-nouveau': '#f8f6f0',
  archival: '#f8f9fa',
  hoefe: '#f5f0e1',
  'brutal-pop': '#282833',
}

const toRgb = (color: string): [number, number, number] => {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgb = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!rgb) throw new Error(`unparseable colour: ${color}`)
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
}

const luma = (color: string) => {
  const [r, g, b] = toRgb(color)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

describe('getThemeMarkerColors', () => {
  it.each(THEMES)('%s defines every marker state', (theme) => {
    const colors = getThemeMarkerColors(theme)
    for (const state of STATES) {
      expect(typeof colors[state]).toBe('string')
      expect(colors[state].length).toBeGreaterThan(0)
    }
  })

  it.each(THEMES)('%s returns colours this codebase can actually parse', (theme) => {
    // MapboxMap derives label-chip text colour and alpha from these strings, so an exotic
    // format (hsl, named colour) would silently degrade to a fallback rather than throw.
    const colors = getThemeMarkerColors(theme)
    for (const state of STATES) {
      expect(() => toRgb(colors[state])).not.toThrow()
    }
  })

  // A duplicate colour is the quiet failure: the map still renders, it just stops distinguishing
  // two states that mean very different things.
  it.each(THEMES)('%s keeps active, declining and closed visually distinct', (theme) => {
    const c = getThemeMarkerColors(theme)
    const core = [c.active, c.declining, c.closed]
    expect(new Set(core).size).toBe(3)
  })

  it.each(THEMES)('%s does not reuse a wartime colour for the postwar state', (theme) => {
    const c = getThemeMarkerColors(theme)
    // `standing` answers a different question than active/declining/closed - what is at this
    // address now - so it must not be mistakable for a step on the wartime ramp.
    expect([c.active, c.declining, c.closed]).not.toContain(c.standing)
  })

  it.each(THEMES)('%s renders the postwar state legibly against its own background', (theme) => {
    const { standing } = getThemeMarkerColors(theme)
    const background = BACKGROUNDS[theme]
    // A light pin on a light ground (or dark on dark) is invisible. This is exactly why moody
    // could no longer share a colour block with the four light themes.
    expect(Math.abs(luma(standing) - luma(background))).toBeGreaterThan(0.25)
  })

  it('falls back to a defined palette for an unknown theme', () => {
    const c = getThemeMarkerColors('does-not-exist')
    for (const state of STATES) expect(typeof c[state]).toBe('string')
  })

  it('falls back for an undefined theme, as happens on first render', () => {
    const c = getThemeMarkerColors(undefined)
    for (const state of STATES) expect(typeof c[state]).toBe('string')
  })
})

describe('theme style routing', () => {
  it.each(THEMES)('%s is routed to exactly one style strategy', (theme) => {
    // MapboxMap early-returns from applyThemeStyles for custom-style themes. A theme in both
    // buckets would run imperative setPaintProperty loops against a declarative style; a theme
    // in neither silently renders the default basemap.
    const custom = isCustomStyleTheme(theme)
    const modification = isModificationTheme(theme)
    expect(custom || modification).toBe(true)
    expect(custom && modification).toBe(false)
  })

  it('routes brutal-pop through the declarative style path', () => {
    expect(isCustomStyleTheme('brutal-pop')).toBe(true)
    expect(isModificationTheme('brutal-pop')).toBe(false)
  })
})
