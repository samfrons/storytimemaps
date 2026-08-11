import type { Metadata } from 'next'

// Development test page for map overlay behaviour, not a public destination.
export const metadata: Metadata = {
  title: 'Overlay Test (Dev) | StoryTimeMaps',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OverlayTestLayout({ children }: { children: React.ReactNode }) {
  return children
}
