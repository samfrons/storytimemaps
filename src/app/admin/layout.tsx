import type { Metadata } from 'next'

// Covers /admin/outreach and /admin/proposals — both password/auth-gated internal tools,
// never meant to be found by search. robots.ts also disallows /admin/* from being crawled;
// this is the second layer that stops indexing even if a crawler reaches the page anyway.
export const metadata: Metadata = {
  title: 'Admin | StoryTimeMaps',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
