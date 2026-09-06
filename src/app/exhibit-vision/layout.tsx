import type { Metadata } from 'next'
import { shareCard } from '../shareCard'

// page.tsx is 'use client'; metadata lives in this sibling layout (see map/layout.tsx).
export const metadata: Metadata = {
  title: 'Museum Exhibition Proposal | StoryTimeMaps',
  description:
    'A proposed physical exhibition for venues and funders: a floor-projected city map, a year slider, and a table of memorial plaques — built on the same archive of Jewish-owned Berlin businesses as the digital map.',
  alternates: {
    canonical: '/exhibit-vision',
  },
  ...shareCard('exhibit-vision', {
    title: 'Museum Exhibition Proposal | StoryTimeMaps',
    description:
      'A proposed physical exhibition documenting Jewish-owned businesses in Berlin, 1900-1945, for venues and funders.',
    alt: 'The exhibition proposal page, showing Berlin cut into a gallery floor with lit markers standing on it.',
    path: '/exhibit-vision',
  }),
}

export default function ExhibitVisionLayout({ children }: { children: React.ReactNode }) {
  return children
}
