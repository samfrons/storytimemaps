'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useIsMounted } from '../../hooks/useIsMounted';
import { TranslationProvider } from '../../i18n/TranslationContext';
import { useTranslation } from '../../i18n/useTranslation';
import BerlinDistrictsChart from './components/BerlinDistrictsChart';
import MonthlyDestructionChart from './components/MonthlyDestructionChart';
import YearlyDestructionChart from './components/YearlyDestructionChart';

function BarChartsContent() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const mounted = useIsMounted();
  const [activeChart, setActiveChart] = useState<'districts' | 'monthly' | 'yearly'>('districts');

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--background)]" />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold font-mono mb-2">
            Data Visualizations
          </h1>
          <p className="text-sm md:text-base font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Interactive charts showing the destruction of Jewish commercial activity in Berlin
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveChart('districts')}
              className={`px-4 py-3 text-sm font-mono transition-all ${
                activeChart === 'districts' ? 'border-b-2' : ''
              }`}
              style={{
                borderColor: activeChart === 'districts' ? 'var(--primary)' : 'transparent',
                color: activeChart === 'districts' ? 'var(--primary)' : 'var(--foreground-muted)',
                backgroundColor: 'transparent'
              }}
            >
              Berlin Districts
            </button>
            <button
              onClick={() => setActiveChart('monthly')}
              className={`px-4 py-3 text-sm font-mono transition-all ${
                activeChart === 'monthly' ? 'border-b-2' : ''
              }`}
              style={{
                borderColor: activeChart === 'monthly' ? 'var(--primary)' : 'transparent',
                color: activeChart === 'monthly' ? 'var(--primary)' : 'var(--foreground-muted)',
                backgroundColor: 'transparent'
              }}
            >
              Monthly Timeline (1938-39)
            </button>
            <button
              onClick={() => setActiveChart('yearly')}
              className={`px-4 py-3 text-sm font-mono transition-all ${
                activeChart === 'yearly' ? 'border-b-2' : ''
              }`}
              style={{
                borderColor: activeChart === 'yearly' ? 'var(--primary)' : 'transparent',
                color: activeChart === 'yearly' ? 'var(--primary)' : 'var(--foreground-muted)',
                backgroundColor: 'transparent'
              }}
            >
              Yearly Overview (1933-45)
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeChart === 'districts' && <BerlinDistrictsChart theme={theme} />}
        {activeChart === 'monthly' && <MonthlyDestructionChart theme={theme} />}
        {activeChart === 'yearly' && <YearlyDestructionChart theme={theme} />}
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
  return (
    <TranslationProvider>
      <BarChartsContent />
    </TranslationProvider>
  );
}