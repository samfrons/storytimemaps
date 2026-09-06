// "Heute" (today) support for the history tour — pure helpers, no React.
//
// The tour renders the 1930 city; this module answers three separate
// present-day questions for a stop: whether the building it happened in
// still stands (todayStatus, from the traced footprints), what the
// catalogue's own "the site today" paragraph says (extractSiteToday), and
// how to link out to a real photograph of the site (streetViewLink /
// streetViewEmbedUrl) since the archive holds no present-day photos itself.

import { FOOTPRINTS_1930 } from './footprints1930'

export type TodayStatus = 'standing' | 'replacement' | 'gone'

/**
 * Present-day status of the building at a stop's address, derived from the
 * traced 1930 footprints (see footprints1930.ts):
 *  - 'surviving'   -> 'standing'     the pre-war building is still there.
 *  - 'replacement' -> 'replacement'  a later building now occupies the site.
 *  - absent        -> 'gone'         no footprint traced; the record marks
 *                                    the pre-war building as destroyed with
 *                                    no asserted replacement (stops 5 and 6).
 */
export function todayStatus(id: string): TodayStatus {
  const footprint = FOOTPRINTS_1930[id]
  if (!footprint) return 'gone'
  return footprint.source === 'surviving' ? 'standing' : 'replacement'
}

export const STATUS_LABEL: Record<TodayStatus, { de: string; en: string }> = {
  standing: { de: 'Gebäude steht noch', en: 'Building still stands' },
  replacement: {
    de: 'Nachkriegsbau an derselben Stelle',
    en: 'Post-war building on the same site',
  },
  gone: { de: 'Nicht mehr vorhanden', en: 'No longer standing' },
}

/**
 * Pulls the "the site today" paragraph(s) out of a timeline entry's
 * longDescription. The catalogue text marks that section with its own line
 * reading exactly "The site today" (case-insensitive), followed by one or
 * more paragraphs separated by blank lines. Returns null when the marker
 * line is absent.
 */
export function extractSiteToday(longDescription: string): string | null {
  const lines = longDescription.split('\n')
  const markerIdx = lines.findIndex((line) => /^the site today$/im.test(line.trim()))
  if (markerIdx === -1) return null

  const paragraphs = lines
    .slice(markerIdx + 1)
    .map((p) => p.trim())
    .filter(Boolean)

  return paragraphs.length > 0 ? paragraphs.join('\n\n') : null
}

/**
 * Free, keyless link to Google Maps Street View at a coordinate — opens the
 * panorama viewer in a new tab/app. Used as the fallback when no Embed API
 * key is configured.
 */
export function streetViewLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
}

/**
 * Google Maps Embed API requests are free of charge (Google pricing sheet).
 * Never swap this for the Static Street View API, which is billed per
 * request — see CLAUDE.md API cost rules.
 */
export function streetViewEmbedUrl(
  lat: number,
  lng: number,
  heading: number,
  key: string | undefined
): string | null {
  if (!key) return null
  const params = new URLSearchParams({
    key,
    location: `${lat},${lng}`,
    heading: String(heading),
    pitch: '0',
    fov: '90',
  })
  return `https://www.google.com/maps/embed/v1/streetview?${params.toString()}`
}

/**
 * Which state the tour should open in. The URL wins so an embed (the
 * committee deck, a shared link) can open straight onto the present-day
 * view: `?view=heute` (or `today`) starts in "Heute", `?view=1930` in the
 * 1930 relief. Without a `view` param the reader's stored preference from
 * earlier in the session applies (`stored` is the raw sessionStorage value,
 * '1' meaning "Heute"). Pure: takes `location.search` and the stored value
 * so it can run in a test without a window.
 */
export function initialTodayMode(search: string, stored: string | null): boolean {
  const view = new URLSearchParams(search).get('view')?.trim().toLowerCase()
  if (view === 'heute' || view === 'today') return true
  if (view === '1930') return false
  return stored === '1'
}
