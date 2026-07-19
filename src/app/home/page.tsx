'use client'

import React, { Suspense } from 'react'
import Homepage from '../components/Homepage'

export default function HomepageRoute() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="font-mono" style={{ color: 'var(--primary)' }}>
            Loading…
          </div>
        </div>
      }
    >
      <Homepage />
    </Suspense>
  )
}
