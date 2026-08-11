import type { Metadata } from 'next'

// page.tsx is 'use client' (it drives the interactive Mapbox view and reads URL state),
// so metadata has to live in this sibling layout — same pattern as history-tour/layout.tsx
// and museum-exhibit/layout.tsx.
export const metadata: Metadata = {
  title: 'Interactive Map — Jewish Businesses in Berlin 1900-1945 | StoryTimeMaps',
  description:
    'Explore Jewish-owned businesses across Berlin on an interactive map with a year-by-year time slider from 1900 to 1945. Filter by trade, see each business change state as the historical record does, and read the researched stories behind them.',
  alternates: {
    canonical: '/map',
  },
  openGraph: {
    title: 'Interactive Map — Jewish Businesses in Berlin 1900-1945',
    description:
      'A year-by-year map of Jewish-owned businesses in Berlin, 1900-1945, built from archival research.',
    url: '/map',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive Map — Jewish Businesses in Berlin 1900-1945',
    description:
      'A year-by-year map of Jewish-owned businesses in Berlin, 1900-1945, built from archival research.',
  },
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children
}
