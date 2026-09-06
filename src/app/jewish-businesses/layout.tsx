import type { Metadata } from 'next'
import { shareCard } from '../shareCard'
import fs from 'fs'
import path from 'path'

// page.tsx is 'use client'; metadata lives in this sibling layout (see map/layout.tsx).
export const metadata: Metadata = {
  title: 'Jewish Business Records — Berlin 1900-1945 | StoryTimeMaps',
  description:
    'The raw archive behind StoryTimeMaps: geocoded records of Jewish-owned businesses in Berlin, 1900-1945, each with a name, address, trade, and the dates the historical record supports.',
  alternates: {
    canonical: '/jewish-businesses',
  },
  ...shareCard('jewish-businesses', {
    title: 'Jewish Business Records — Berlin 1900-1945 | StoryTimeMaps',
    description:
      'Geocoded records of Jewish-owned businesses in Berlin, 1900-1945, drawn from archival research.',
    alt: 'The business records browser for the Berlin archive.',
    path: '/jewish-businesses',
  }),
}

/**
 * Dataset JSON-LD for the record archive. numberOfItems is read from data/storymaps.json
 * at request time rather than hardcoded, so it can't silently drift from what the page
 * actually serves as the dataset grows or is corrected.
 */
function getRecordCount(): number | null {
  try {
    const file = fs.readFileSync(path.join(process.cwd(), 'data', 'storymaps.json'), 'utf8')
    const records = JSON.parse(file)
    return Array.isArray(records) ? records.length : null
  } catch {
    return null
  }
}

export default function JewishBusinessesLayout({ children }: { children: React.ReactNode }) {
  const recordCount = getRecordCount()

  const datasetLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Jewish Businesses in Berlin, 1900-1945',
    description:
      'Geocoded records of Jewish-owned businesses in Berlin, Germany, from 1900 to 1945, built from archival research and the Datenbank jüdischer Gewerbebetriebe in Berlin at Humboldt-Universität zu Berlin.',
    ...(recordCount ? { size: `${recordCount} records` } : {}),
    temporalCoverage: '1900/1945',
    spatialCoverage: {
      '@type': 'Place',
      name: 'Berlin, Germany',
    },
    creator: {
      '@type': 'Organization',
      name: 'StoryTimeMaps',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetLd) }}
      />
      {children}
    </>
  )
}
