'use client'

import React, { Suspense } from 'react'
import SiteHeader from '../components/SiteHeader'
import HomeFooter from '../components/homepage/HomeFooter'
import ExhibitHero from '../components/exhibit/ExhibitHero'
import ExhibitStations from '../components/exhibit/ExhibitStations'
import ExhibitSpec from '../components/exhibit/ExhibitSpec'
import ExhibitPartners from '../components/exhibit/ExhibitPartners'

/**
 * The exhibition proposal, addressed to venues and funders.
 *
 * This page used to be a four-card summary with no picture of anything. A
 * venue reading it could not see the room, could not size it against their
 * own space, and could not tell which parts already exist. It now carries the
 * design studies, the three scales, and the technical specification — and it
 * says on every image which of them is a rendering and which is the software
 * that is already running at /museum-exhibit.
 */
function ExhibitVisionContent() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <SiteHeader active="/exhibit-vision" />
      <main>
        <ExhibitHero />
        <ExhibitStations />
        <ExhibitSpec />
        <ExhibitPartners />
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
        <span className="block">Loading…</span>
        <span className="block text-sm opacity-60">Laden…</span>
      </div>
    </div>
  )
}

export default function ExhibitVisionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExhibitVisionContent />
    </Suspense>
  )
}
