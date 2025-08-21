'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useTheme } from 'next-themes';
import { useIsMounted } from '../../hooks/useIsMounted';
// TranslationProvider now in root layout
import { useTranslation } from '../../i18n/useTranslation';
import dynamic from 'next/dynamic';
import MonthlyDestructionChart from './components/MonthlyDestructionChart';
import YearlyDestructionChart from './components/YearlyDestructionChart';
import Sidebar from '../components/Sidebar';

// Dynamically import 3D map to avoid SSR issues
const District3DMap = dynamic(() => import('./components/District3DMap'), {
  ssr: false,
  loading: () => <div className="h-[700px] flex items-center justify-center font-mono">Loading 3D Map...</div>
});

function BarChartsContent() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const mounted = useIsMounted();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
      {/* Sidebar Navigation */}
      <Suspense fallback={<div className="w-20 h-screen bg-var(--background)" />}>
        <Sidebar />
      </Suspense>
      
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 md:pl-20">
          <h1 className="text-2xl md:text-3xl font-bold font-mono mb-2">
            {t('barcharts.title')}
          </h1>
          <p className="text-sm md:text-base font-mono" style={{ color: 'var(--foreground-muted)' }}>
            {t('barcharts.subtitle')}
          </p>
        </div>
      </div>

      {/* All Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 md:pl-20">
        
        {/* 3D Berlin Map Section */}
        <section>
          <h2 className="text-xl font-bold font-mono mb-4">{t('barcharts.3dMap.title')}</h2>
          <District3DMap theme={theme} />
        </section>

        {/* Analytics Grid */}
        <section>
          <h2 className="text-xl font-bold font-mono mb-6">{t('barcharts.timeline.title')}</h2>
          
          {/* Yearly Chart - Full Width */}
          <div className="mb-8">
            <YearlyDestructionChart theme={theme} />
          </div>
          
          {/* Monthly Chart - Below */}
          <div>
            <MonthlyDestructionChart theme={theme} />
          </div>
        </section>

      </div>

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden fixed left-4 w-10 h-10 flex items-center justify-center border backdrop-blur-sm cursor-pointer hover:opacity-80 hot-button"
        style={{ 
          top: '10px',
          zIndex: 10001,
          backgroundColor: 'var(--input-bg)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)',
          cursor: 'pointer'
        }}
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {showMobileMenu ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Sidebar Overlay */}
      {showMobileMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50" 
          style={{ zIndex: 9998 }}
          onClick={() => setShowMobileMenu(false)}
        >
          <div 
            className="w-20 h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Suspense fallback={<div className="w-20 h-full" />}>
              <Sidebar />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BarChartsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading charts...</div>
      </div>
    }>
      <BarChartsContent />
    </Suspense>
  );
}