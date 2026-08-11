import type { Metadata } from 'next'

// /[theme] is an internal redirect helper (sets a theme then sends the visitor to /) rather
// than a content page. It has no content of its own to rank on, and every valid value is
// already reachable through the theme switcher on a real page — noindex, and left out of
// sitemap.ts, so it never competes with the pages it redirects from.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function ThemeLayout({ children }: { children: React.ReactNode }) {
  return children
}
