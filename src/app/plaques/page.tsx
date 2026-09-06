'use client'

import React, { Suspense } from 'react'
import SiteHeader from '../components/SiteHeader'
import HomeFooter from '../components/homepage/HomeFooter'
import PlaqueHero from '../components/plaques/PlaqueHero'
import PlaqueAnatomy from '../components/plaques/PlaqueAnatomy'
import PlaqueMaking from '../components/plaques/PlaqueMaking'
import PlaqueGallery from '../components/plaques/PlaqueGallery'
import PlaqueSupport from '../components/plaques/PlaqueSupport'

/**
 * The memorial plaque initiative.
 *
 * Rebuilt around what the project can actually show: the production cutting
 * files, the eligibility rule that decides which records qualify, and the
 * fabrication constraints the artwork is drawn to. The previous version
 * explained the idea in three emoji cards and never said what a plaque
 * contains, who is eligible for one, or how it is made.
 *
 * PlaquesHero (the old hero) is still used in compact form on /map and is
 * deliberately left alone.
 */
function PlaquesPageContent() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <SiteHeader active="/plaques" />
      <main>
        <PlaqueHero />
        <PlaqueAnatomy />
        <PlaqueMaking />
        <PlaqueGallery />
        <PlaqueSupport />
      </main>
      <HomeFooter />
    </div>
  )
}

function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="font-mono" style={{ color: 'var(--primary)' }}>
        <span className="block">Loading...</span>
        <span className="block text-sm opacity-60">Laden... / לאָדן...</span>
      </div>
    </div>
  )
}

export default function PlaquesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PlaquesPageContent />
    </Suspense>
  )
}
