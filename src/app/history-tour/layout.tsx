import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History Tour — Fifteen Addresses | Jewish Businesses in Berlin 1900-1945',
  description:
    'A scroll-driven tour through fifteen Jewish-owned Berlin businesses from the story archive, rendered on a period-style city plan with a timeline of the years 1925-1945.',
}

export default function HistoryTourLayout({ children }: { children: React.ReactNode }) {
  return children
}
