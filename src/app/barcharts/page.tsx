'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useIsMounted } from '../../hooks/useIsMounted';
// TranslationProvider now in root layout
import { useTranslation } from '../../i18n/useTranslation';
import dynamic from 'next/dynamic';
import MonthlyDestructionChart from './components/MonthlyDestructionChart';
import YearlyDestructionChart from './components/YearlyDestructionChart';

// Dynamically import 3D map to avoid SSR issues
const District3DMap = dynamic(() => import('./components/District3DMap'), {
  ssr: false,
  loading: () => <div className="h-[700px] flex items-center justify-center font-mono">Loading 3D Map...</div>
});

function BarChartsContent() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const mounted = useIsMounted();

  // Don't render anything until mounted and theme is ready
  if (!mounted || !theme) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div className="font-mono text-sm">Loading visualizations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold font-mono mb-2">
            Interactive Data Visualizations
          </h1>
          <p className="text-sm md:text-base font-mono" style={{ color: 'var(--foreground-muted)' }}>
            3D map exploration with timeline analysis of Jewish business destruction in Berlin
          </p>
        </div>
      </div>

      {/* All Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* 3D Berlin Map Section */}
        <section>
          <h2 className="text-xl font-bold font-mono mb-4">3D Interactive Berlin Map</h2>
          <District3DMap theme={theme} />
        </section>

        {/* Analytics Grid */}
        <section>
          <h2 className="text-xl font-bold font-mono mb-6">Timeline Analysis</h2>
          
          {/* Monthly and Yearly Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Monthly Chart */}
            <div>
              <MonthlyDestructionChart theme={theme} />
            </div>
            
            {/* Yearly Chart */}
            <div>
              <YearlyDestructionChart theme={theme} />
            </div>
            
          </div>
        </section>

      </div>

      {/* Back to Main Button */}
      <div className="fixed bottom-6 right-6">
        <a
          href="/"
          className="px-6 py-3 border font-mono text-sm transition-all hover:opacity-80"
          style={{
            backgroundColor: 'var(--primary)',
            borderColor: 'var(--primary)',
            color: 'var(--background)'
          }}
        >
          ← Back to Map
        </a>
      </div>
    </div>
  );
}

export default function BarChartsPage() {
  return <BarChartsContent />;
}