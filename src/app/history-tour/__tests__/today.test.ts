import { extractSiteToday, streetViewEmbedUrl, streetViewLink, todayStatus } from '../today'

describe('todayStatus', () => {
  it('reports a surviving footprint as standing', () => {
    // stop '3' is a 'surviving' entry in FOOTPRINTS_1930
    expect(todayStatus('3')).toBe('standing')
  })

  it('reports a replacement footprint as replacement', () => {
    // stop '1' is a 'replacement' entry in FOOTPRINTS_1930
    expect(todayStatus('1')).toBe('replacement')
  })

  it('reports a missing footprint as gone', () => {
    // stop '5' has no entry — the pre-war building is documented destroyed
    expect(todayStatus('5')).toBe('gone')
  })
})

describe('extractSiteToday', () => {
  // Taken from public/data/timeline/1.json's final longDescription.
  const eBraunText = `After the war, the Viennese company E. Braun & Co. was returned to the founders' heirs; Henry Myer became director in 1962. In 1954, the Oser-Braun and Myer-Braun families approached Georg Wiedersum in the hope of reaching an amicable agreement, and the forced sale of 1938 was declared to be null and void. Wiedersum's 'successor' store existed at Kurfürstendamm 43 until the year 2000. The Berlin branch on Unter den Linden was never rebuilt.

The site today

On August 23, 1997, the Hotel Adlon was reopened on the original site at Unter den Linden 1. The new building extends across the block to former street number 75, where the E. Braun & Co. store was located – once again, the first floor of the hotel houses stores offering luxury goods. A branch of the Swiss shoe store Bally stands at Kurfürstendamm 219; Bally also took over the company's main branch in Vienna in 1985. In 1988, Gustav Oser sold the rights to the name E. Braun & Co. to a US investor, who opened luxury goods stores in New York and Beverly Hills, following in the footsteps of the original company founders in Austria.`

  it('extracts the paragraph(s) after the "The site today" marker', () => {
    const result = extractSiteToday(eBraunText)
    expect(result).not.toBeNull()
    expect(result).toContain('Hotel Adlon was reopened')
    expect(result).toContain('Bally also took over')
    expect(result?.startsWith('On August 23, 1997')).toBe(true)
  })

  it('joins multiple paragraphs after the marker with a blank line', () => {
    const text =
      'Intro paragraph.\n\nThe site today\n\nFirst today paragraph.\n\nSecond today paragraph.'
    expect(extractSiteToday(text)).toBe('First today paragraph.\n\nSecond today paragraph.')
  })

  it('is case-insensitive on the marker line', () => {
    const text = 'Some history.\n\nTHE SITE TODAY\n\nStill standing.'
    expect(extractSiteToday(text)).toBe('Still standing.')
  })

  it('returns null when no marker line is present', () => {
    const text = 'Just a plain history with no present-day section at all.'
    expect(extractSiteToday(text)).toBeNull()
  })
})

describe('streetViewLink', () => {
  it('builds a free, keyless pano deep link', () => {
    const url = streetViewLink(52.516092, 13.382663)
    expect(url).toBe(
      'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=52.516092,13.382663'
    )
  })
})

describe('streetViewEmbedUrl', () => {
  it('returns null when no key is configured', () => {
    expect(streetViewEmbedUrl(52.516092, 13.382663, 45, undefined)).toBeNull()
    expect(streetViewEmbedUrl(52.516092, 13.382663, 45, '')).toBeNull()
  })

  it('builds an embed URL carrying location, heading, pitch and fov when a key is given', () => {
    const url = streetViewEmbedUrl(52.516092, 13.382663, 45, 'TEST_KEY')
    expect(url).not.toBeNull()
    const parsed = new URL(url as string)
    expect(parsed.origin + parsed.pathname).toBe('https://www.google.com/maps/embed/v1/streetview')
    expect(parsed.searchParams.get('key')).toBe('TEST_KEY')
    expect(parsed.searchParams.get('location')).toBe('52.516092,13.382663')
    expect(parsed.searchParams.get('heading')).toBe('45')
    expect(parsed.searchParams.get('pitch')).toBe('0')
    expect(parsed.searchParams.get('fov')).toBe('90')
  })
})
