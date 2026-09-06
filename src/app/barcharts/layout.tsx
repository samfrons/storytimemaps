import type { Metadata } from 'next'

// Internal chart-development scratch page, not a public destination.
export const metadata: Metadata = {
  title: 'Bar Charts (Dev) | StoryTimeMaps',
  robots: {
    index: false,
    follow: false,
  },
}

export default function BarchartsLayout({ children }: { children: React.ReactNode }) {
  return children
}
