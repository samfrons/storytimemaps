'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export interface ModeToggleProps {
  mode: 'stories' | 'database';
  onModeChange: (mode: 'stories' | 'database') => void;
  storiesCount: number;
  totalCount: number;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ 
  mode, 
  onModeChange, 
  storiesCount, 
  totalCount 
}) => {
  const { t } = useTranslation();
  return (
    <div 
      className="mode-selector w-full px-4 py-3 border-b"
      style={{ 
        backgroundColor: 'var(--input-bg)',
        borderColor: 'var(--border)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Featured Stories Button */}
          <button 
            className={`group flex-1 p-4 border transition-all duration-200 relative ${
              mode === 'stories' ? 'mode-btn-active' : 'mode-btn-inactive'
            }`}
            onClick={() => onModeChange('stories')}
            style={{
              backgroundColor: mode === 'stories' ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: mode === 'stories' ? 'var(--primary)' : 'var(--border)',
              color: mode === 'stories' ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (mode !== 'stories') {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'stories') {
                e.currentTarget.style.backgroundColor = 'var(--input-bg)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }
            }}
          >
            <div className="text-left">
              <div className="font-semibold text-lg mb-1">{t('mainPage.overlay.featuredStories')}</div>
              <div 
                className="font-mono text-sm mb-2"
                style={{ 
                  color: mode === 'stories' ? 'var(--background)' : 'var(--primary)' 
                }}
              >
                {storiesCount} {t('mainPage.overlay.detailedNarratives')}
              </div>
              <div 
                className="text-sm leading-relaxed"
                style={{ 
                  color: mode === 'stories' ? 'var(--background)' : 'var(--foreground-muted)' 
                }}
              >
                {t('mainPage.overlay.personalAccounts')}
              </div>
            </div>
            {/* Arrow Icon */}
            <svg 
              className="w-5 h-5 absolute top-4 right-4 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                color: mode === 'stories' ? 'var(--background)' : 'var(--foreground)'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>

          {/* Historical Database Button */}
          <button 
            className={`group flex-1 p-4 border transition-all duration-200 relative ${
              mode === 'database' ? 'mode-btn-active' : 'mode-btn-inactive'
            }`}
            onClick={() => onModeChange('database')}
            style={{
              backgroundColor: mode === 'database' ? 'var(--primary)' : 'var(--input-bg)',
              borderColor: mode === 'database' ? 'var(--primary)' : 'var(--border)',
              color: mode === 'database' ? 'var(--background)' : 'var(--foreground)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (mode !== 'database') {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'database') {
                e.currentTarget.style.backgroundColor = 'var(--input-bg)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }
            }}
          >
            <div className="text-left">
              <div className="font-semibold text-lg mb-1">{t('mainPage.overlay.historicalDatabase')}</div>
              <div 
                className="font-mono text-sm mb-2"
                style={{ 
                  color: mode === 'database' ? 'var(--background)' : 'var(--primary)' 
                }}
              >
                {totalCount.toLocaleString()} {t('mainPage.overlay.businessRecords')}
              </div>
              <div 
                className="text-sm leading-relaxed"
                style={{ 
                  color: mode === 'database' ? 'var(--background)' : 'var(--foreground-muted)' 
                }}
              >
                {t('mainPage.overlay.completeRegistry')}
              </div>
            </div>
            {/* Arrow Icon */}
            <svg 
              className="w-5 h-5 absolute top-4 right-4 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                color: mode === 'database' ? 'var(--background)' : 'var(--foreground)'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ModeToggle);