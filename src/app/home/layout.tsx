import type { Metadata } from 'next'

// /home immediately redirects to / (see page.tsx) — nothing here to index, and a crawler
// would just be indexing a copy of the homepage under a second URL.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children
}
