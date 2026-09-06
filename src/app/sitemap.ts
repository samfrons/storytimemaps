import type { MetadataRoute } from 'next'
import { ONBOARDING_DOCS } from './onboarding/docs'

// Same fallback as layout.tsx's metadataBase — keep the two in step if the env var changes.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://b3rlin.storytimemaps.com'

/**
 * Every public, indexable route on the site, plus the onboarding guides generated
 * from ONBOARDING_DOCS. Deliberately excludes: the /[theme] redirect helper, /admin/*,
 * /dashboard, and the dev/test routes (/barcharts, /overlay-test, /business-details-test,
 * /test-full-dataset) — those carry `robots: { index: false }` in their own layout and
 * have no reason to be offered to a crawler here either.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    // No trailing slash: this has to be byte-identical to the canonical the root layout
    // emits, or the sitemap offers a crawler a URL the page itself disavows.
    { url: SITE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/map`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${SITE_URL}/jewish-businesses`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    { url: `${SITE_URL}/frankfurt`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    {
      url: `${SITE_URL}/history-tour`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    { url: `${SITE_URL}/plaques`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${SITE_URL}/exhibit-vision`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/museum-exhibit`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    { url: `${SITE_URL}/education`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    {
      url: `${SITE_URL}/education/workbook`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/education/activities`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/collaborate`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/onboarding`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  const onboardingRoutes: MetadataRoute.Sitemap = ONBOARDING_DOCS.map((doc) => ({
    url: `${SITE_URL}/onboarding/${doc.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  return [...staticRoutes, ...onboardingRoutes]
}
