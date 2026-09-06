import type { Metadata } from 'next'
import { shareCard } from '../shareCard'

export const metadata: Metadata = {
  title: 'History Tour — Fifteen Addresses | Jewish Businesses in Berlin 1900-1945',
  description:
    'A scroll-driven tour through fifteen Jewish-owned Berlin businesses from the story archive, rendered on a sepia 3D relief of the city with a timeline of the years 1925-1945.',
  alternates: {
    canonical: '/history-tour',
  },
  ...shareCard('history-tour', {
    title: 'History Tour — Fifteen Addresses | Jewish Businesses in Berlin 1900-1945',
    description:
      'A scroll-driven tour through fifteen Jewish-owned Berlin businesses, 1925-1945.',
    alt: 'The history tour: fifteen numbered addresses on a sepia aerial relief of Berlin, beside the story panel for the Deutsche Theater.',
    path: '/history-tour',
  }),
}

export default function HistoryTourLayout({ children }: { children: React.ReactNode }) {
  return children
}
