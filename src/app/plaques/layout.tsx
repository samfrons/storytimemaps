import type { Metadata } from 'next'
import { shareCard } from '../shareCard'

// page.tsx is 'use client'; metadata lives in this sibling layout (see map/layout.tsx).
export const metadata: Metadata = {
  title: 'Memorial Plaque Initiative | StoryTimeMaps',
  description:
    'Physical memorial plaques marking former Jewish-owned businesses in Berlin — what a plaque must say under the four-facts rule, how it is cut, and how to sponsor one at a real address. Funded by Stiftung Zurückgeben.',
  alternates: {
    canonical: '/plaques',
  },
  ...shareCard('plaques', {
    title: 'Memorial Plaque Initiative | StoryTimeMaps',
    description:
      'Physical memorial plaques marking former Jewish-owned businesses in Berlin, funded by Stiftung Zurückgeben.',
    alt: 'The memorial plaque initiative: "Put the record back on the wall it was taken from."',
    path: '/plaques',
  }),
}

export default function PlaquesLayout({ children }: { children: React.ReactNode }) {
  return children
}
