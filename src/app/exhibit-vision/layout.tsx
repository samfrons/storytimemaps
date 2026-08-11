import type { Metadata } from 'next'

// page.tsx is 'use client'; metadata lives in this sibling layout (see map/layout.tsx).
export const metadata: Metadata = {
  title: 'Museum Exhibition Proposal | StoryTimeMaps',
  description:
    'A proposed physical exhibition for venues and funders: a floor-projected city map, a year slider, and a table of memorial plaques — built on the same archive of Jewish-owned Berlin businesses as the digital map.',
  alternates: {
    canonical: '/exhibit-vision',
  },
  openGraph: {
    title: 'Museum Exhibition Proposal | StoryTimeMaps',
    description:
      'A proposed physical exhibition documenting Jewish-owned businesses in Berlin, 1900-1945, for venues and funders.',
    url: '/exhibit-vision',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Museum Exhibition Proposal | StoryTimeMaps',
    description:
      'A proposed physical exhibition documenting Jewish-owned businesses in Berlin, 1900-1945, for venues and funders.',
  },
}

export default function ExhibitVisionLayout({ children }: { children: React.ReactNode }) {
  return children
}
