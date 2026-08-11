import type { Metadata } from 'next'

// page.tsx is 'use client'; metadata lives in this sibling layout (see map/layout.tsx).
export const metadata: Metadata = {
  title: 'Memorial Plaque Initiative | StoryTimeMaps',
  description:
    'Physical memorial plaques marking former Jewish-owned businesses in Berlin — what a plaque must say under the four-facts rule, how it is cut, and how to sponsor one at a real address. Funded by Stiftung Zurückgeben.',
  alternates: {
    canonical: '/plaques',
  },
  openGraph: {
    title: 'Memorial Plaque Initiative | StoryTimeMaps',
    description:
      'Physical memorial plaques marking former Jewish-owned businesses in Berlin, funded by Stiftung Zurückgeben.',
    url: '/plaques',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memorial Plaque Initiative | StoryTimeMaps',
    description:
      'Physical memorial plaques marking former Jewish-owned businesses in Berlin, funded by Stiftung Zurückgeben.',
  },
}

export default function PlaquesLayout({ children }: { children: React.ReactNode }) {
  return children
}
