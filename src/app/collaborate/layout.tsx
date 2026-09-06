import type { Metadata } from 'next'
import { shareCard } from '../shareCard'

// page.tsx is 'use client'; metadata lives in this sibling layout (see map/layout.tsx).
export const metadata: Metadata = {
  title: 'Contribute to StoryTimeMaps | StoryTimeMaps',
  description:
    'Four ways to contribute to StoryTimeMaps: build the platform, verify historical records against archival sources, contact addresses about memorial plaques, or translate the site into German, Yiddish, and Hebrew.',
  alternates: {
    canonical: '/collaborate',
  },
  ...shareCard('collaborate', {
    title: 'Contribute to StoryTimeMaps | StoryTimeMaps',
    description:
      'Four ways to contribute: development, historical research, plaque outreach, and translation.',
    alt: 'The collaborator page: "Help us preserve the record."',
    path: '/collaborate',
  }),
}

export default function CollaborateLayout({ children }: { children: React.ReactNode }) {
  return children
}
