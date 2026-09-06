import type { Metadata } from 'next'
import './museum-exhibit.css'

export const metadata: Metadata = {
  title: 'Jewish Businesses Exhibition - Interactive Museum Display',
  description:
    'Interactive museum exhibition documenting Jewish-owned businesses in Berlin from 1900-1945',
  alternates: {
    canonical: '/museum-exhibit',
  },
}

export default function MuseumExhibitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="museum-exhibit-container"
      data-theme="none"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
