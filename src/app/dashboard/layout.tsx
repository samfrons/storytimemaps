import type { Metadata } from 'next'

// Signed-in user dashboard — nothing here is meaningful without an active session.
export const metadata: Metadata = {
  title: 'Dashboard | StoryTimeMaps',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
