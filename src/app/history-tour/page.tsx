'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import './history-tour.css'

const HistoryTour = dynamic(() => import('./HistoryTour'), {
  ssr: false,
  loading: () => (
    <div
      className="htour w-full h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--ht-paper)' }}
    >
      <div
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: 'var(--ht-ink-soft)' }}
      >
        Preparing the city plan …
      </div>
    </div>
  ),
})

export default function HistoryTourPage() {
  return <HistoryTour />
}
