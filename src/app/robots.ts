import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://b3rlin.storytimemaps.com'

/**
 * Belt-and-suspenders with the per-route `robots: { index: false }` metadata: those tags
 * stop a page that does get crawled from being indexed, this file stops the crawl in the
 * first place. Both point at the same route list.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/*',
        '/dashboard',
        '/api/*',
        '/barcharts',
        '/overlay-test',
        '/business-details-test',
        '/test-full-dataset',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
