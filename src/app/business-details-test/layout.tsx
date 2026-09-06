import type { Metadata } from 'next'

// Development test page with sample (non-archival) business data, not a public destination.
export const metadata: Metadata = {
  title: 'Business Details Test (Dev) | StoryTimeMaps',
  robots: {
    index: false,
    follow: false,
  },
}

export default function BusinessDetailsTestLayout({ children }: { children: React.ReactNode }) {
  return children
}
