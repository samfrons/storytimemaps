'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Homepage from './components/Homepage'

/**
 * Root landing page. The interactive map now lives at /map.
 *
 * Deep links shared before the split (/?id=…, /?about=true, /?date=…)
 * still point at the root, so forward any map-specific query straight
 * to /map with the full query string intact.
 */
function RootContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isLegacyMapLink =
    searchParams.has('id') || searchParams.has('about') || searchParams.has('date')
  const [redirecting] = useState(isLegacyMapLink)

  useEffect(() => {
    if (isLegacyMapLink) {
      router.replace(`/map?${searchParams.toString()}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLegacyMapLink])

  if (redirecting) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="font-mono" style={{ color: 'var(--primary)' }}>
          Loading the map…
        </div>
      </div>
    )
  }

  return <Homepage />
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div
          className="w-full h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="font-mono" style={{ color: 'var(--primary)' }}>
            Loading…
          </div>
        </div>
      }
    >
      <RootContent />
    </Suspense>
  )
}
