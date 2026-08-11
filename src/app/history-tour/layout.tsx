import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'History Tour — Fifteen Addresses | Jewish Businesses in Berlin 1900-1945',
  description:
    'A scroll-driven tour through fifteen Jewish-owned Berlin businesses from the story archive, rendered on a sepia 3D relief of the city with a timeline of the years 1925-1945.',
  alternates: {
    canonical: '/history-tour',
  },
  openGraph: {
    title: 'History Tour — Fifteen Addresses | Jewish Businesses in Berlin 1900-1945',
    description: 'A scroll-driven tour through fifteen Jewish-owned Berlin businesses, 1925-1945.',
    url: '/history-tour',
    images: [{ url: '/images/history-tour-preview.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'History Tour — Fifteen Addresses | Jewish Businesses in Berlin 1900-1945',
    description: 'A scroll-driven tour through fifteen Jewish-owned Berlin businesses, 1925-1945.',
    images: ['/images/history-tour-preview.webp'],
  },
}

export default function HistoryTourLayout({ children }: { children: React.ReactNode }) {
  return children
}
