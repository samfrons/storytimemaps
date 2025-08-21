'use client';

import React, { Suspense } from 'react';
import Homepage from '../components/Homepage';
// TranslationProvider now in root layout

export default function HomepageRoute() {
  // For client-side component, we'll fetch the data differently
  // or pass it through props from a server component
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading homepage...</div>
      </div>
    }>
      <Homepage businessData={[]} storyMapData={[]} />
    </Suspense>
  );
}