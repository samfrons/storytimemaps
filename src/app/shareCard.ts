import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Metadata } from 'next'

/**
 * The share card ("link preview") a page hands to iMessage, Slack, WhatsApp,
 * Bluesky and the rest.
 *
 * The images are real screenshots of the running site, captured by
 * `scripts/capture-og-screenshots.mjs` into public/images/og/. Re-run
 * `pnpm run og:capture` after a visual change to one of those pages so the
 * preview keeps showing what a reader will actually land on.
 *
 * Format matters more than it looks like it should. og:image is fetched and
 * decoded by each unfurler's own crawler, and every one of them rejects SVG —
 * which is what this site used to serve, and why a link pasted into iMessage
 * unfurled as a bare title with no card at all. Several also reject WebP.
 * JPEG is the safe answer, and the right one for screenshots: as PNG the same
 * shots ran 3-5x larger, past the size at which some unfurlers stop fetching.
 */

/**
 * One slug per route that names its own card. Not all of them have a
 * screenshot on disk yet — see resolveImage() for what happens when they do
 * not, and scripts/capture-og-screenshots.mjs for what it takes to get one.
 */
export type ShareCardSlug =
  | 'home'
  | 'map'
  | 'history-tour'
  | 'jewish-businesses'
  | 'frankfurt'
  | 'plaques'
  | 'education'
  | 'exhibit-vision'
  | 'collaborate'
  | 'onboarding'

type ShareCardOptions = {
  title: string
  description: string
  /** What the screenshot shows, for readers using a screen reader. */
  alt: string
  /** Route the card belongs to, e.g. '/map'. Sets og:url. */
  path: string
}

const OG_DIR = join(process.cwd(), 'public', 'images', 'og')

/**
 * Some routes cannot be captured on every machine — the map pages need a real
 * Mapbox token, and a run without one is refused rather than saved. Falling
 * back to the homepage card means a missing screenshot costs a page its own
 * picture, not its preview: an og:image pointing at a 404 is worse than the
 * SVG this replaced, because the crawler shows nothing either way but you
 * cannot see that it is broken from the code.
 *
 * Checked once per slug, at build time for static routes.
 */
const resolved = new Map<string, string>()

function resolveImage(slug: ShareCardSlug): string {
  const cached = resolved.get(slug)
  if (cached) return cached

  const path = existsSync(join(OG_DIR, `${slug}.jpg`))
    ? `/images/og/${slug}.jpg`
    : '/images/og/home.jpg'
  resolved.set(slug, path)
  return path
}

/** Build the openGraph/twitter half of a page's metadata. */
export function shareCard(
  slug: ShareCardSlug,
  { title, description, alt, path }: ShareCardOptions
): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = {
    url: resolveImage(slug),
    width: 1200,
    height: 630,
    alt,
    type: 'image/jpeg',
  }

  return {
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      alternateLocale: ['en_US', 'yi'],
      siteName: 'StoryTimeMaps',
      title,
      description,
      url: path,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  }
}
