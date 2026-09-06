import type { Metadata } from 'next'
import { shareCard } from '../shareCard'

// page.tsx is 'use client'; metadata lives in this sibling layout (see map/layout.tsx).
export const metadata: Metadata = {
  title: 'Jewish Businesses in Frankfurt 1900-1945 | StoryTimeMaps',
  description:
    'An interactive map of Jewish-owned businesses in Frankfurt am Main from 1900 to 1945, using the same time-based visualization as the Berlin archive.',
  alternates: {
    canonical: '/frankfurt',
  },
  ...shareCard('frankfurt', {
    title: 'Jewish Businesses in Frankfurt 1900-1945 | StoryTimeMaps',
    description:
      'An interactive map of Jewish-owned businesses in Frankfurt am Main from 1900 to 1945.',
    alt: 'The Frankfurt am Main map of Jewish-owned businesses, 1900-1945.',
    path: '/frankfurt',
  }),
}

export default function FrankfurtLayout({ children }: { children: React.ReactNode }) {
  return children
}
