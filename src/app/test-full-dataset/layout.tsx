import type { Metadata } from 'next'

// Development page for exercising the full (test) dataset, not a public destination.
export const metadata: Metadata = {
  title: 'Full Dataset Test (Dev) | StoryTimeMaps',
  robots: {
    index: false,
    follow: false,
  },
}

export default function TestFullDatasetLayout({ children }: { children: React.ReactNode }) {
  return children
}
