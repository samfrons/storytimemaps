'use client'

import React from 'react'
import { useHomepagePoints } from './homepage/homepageData'
import HomeHeader from './homepage/HomeHeader'
import HomeHero from './homepage/HomeHero'
import ConceptSection from './homepage/ConceptSection'
import MemorialBand from './homepage/MemorialBand'
import HistorySection from './homepage/HistorySection'
import DataSection from './homepage/DataSection'
import ResearchFoundation from './homepage/ResearchFoundation'
import ExploreSection from './homepage/ExploreSection'
import HomeFooter from './homepage/HomeFooter'

/**
 * The homepage: explains and showcases the concept of the site.
 *
 * One dataset (loaded once here) powers both the animated hero — every
 * geocoded business drawn as a dot and played through 1900-1945 — and the
 * statistics further down, so the page always agrees with the archive.
 */
const Homepage: React.FC = () => {
  const points = useHomepagePoints()

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--background)' }}>
      <HomeHeader />
      <HomeHero data={points} />
      <ConceptSection />
      <MemorialBand />
      <HistorySection />
      <DataSection data={points} />
      <ResearchFoundation />
      <ExploreSection />
      <HomeFooter />
    </div>
  )
}

export default React.memo(Homepage)
