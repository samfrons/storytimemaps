'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export interface ContentPreviewProps {
  mode: 'stories' | 'database';
  storiesCount: number;
  totalCount: number;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({ 
  mode, 
  storiesCount, 
  totalCount 
}) => {
  const { t } = useTranslation();
  if (mode === 'stories') {
    return (
      <div 
        className="w-full px-4 py-3 border-b"
        style={{ 
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'var(--success)' }}
            />
            <h3 
              className="text-lg font-semibold font-mono"
              style={{ color: 'var(--foreground)' }}
            >
              {t('mainPage.overlay.featuredStoriesModeActive')}
            </h3>
          </div>
          <p 
            className="text-sm leading-relaxed mb-2"
            style={{ color: 'var(--foreground-muted)' }}
          >
            {t('mainPage.overlay.viewingBusinesses').replace('{count}', storiesCount.toString())} {t('mainPage.overlay.intimateGlimpses')}
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span 
              className="px-2 py-1 border"
              style={{ 
                backgroundColor: 'var(--success)',
                color: 'var(--background)',
                borderColor: 'var(--success)'
              }}
            >
              {t('mainPage.overlay.personalStories')}
            </span>
            <span 
              className="px-2 py-1 border"
              style={{ 
                backgroundColor: 'var(--success)',
                color: 'var(--background)',
                borderColor: 'var(--success)'
              }}
            >
              {t('mainPage.overlay.historicalPhotos')}
            </span>
            <span 
              className="px-2 py-1 border"
              style={{ 
                backgroundColor: 'var(--success)',
                color: 'var(--background)',
                borderColor: 'var(--success)'
              }}
            >
              {t('mainPage.overlay.detailedContext')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full px-4 py-3 border-b"
      style={{ 
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <h3 
            className="text-lg font-semibold font-mono"
            style={{ color: 'var(--foreground)' }}
          >
            {t('mainPage.overlay.historicalDatabaseModeActive')}
          </h3>
        </div>
        <p 
          className="text-sm leading-relaxed mb-2"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {t('mainPage.overlay.viewingAllRecords').replace('{count}', totalCount.toLocaleString())} {t('mainPage.overlay.comprehensiveDataset')}
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <span 
            className="px-2 py-1 border"
            style={{ 
              backgroundColor: 'var(--primary)',
              color: 'var(--background)',
              borderColor: 'var(--primary)'
            }}
          >
            {t('mainPage.overlay.completeRegistryTag')}
          </span>
          <span 
            className="px-2 py-1 border"
            style={{ 
              backgroundColor: 'var(--primary)',
              color: 'var(--background)',
              borderColor: 'var(--primary)'
            }}
          >
            {t('mainPage.overlay.researchData')}
          </span>
          <span 
            className="px-2 py-1 border"
            style={{ 
              backgroundColor: 'var(--primary)',
              color: 'var(--background)',
              borderColor: 'var(--primary)'
            }}
          >
            {t('mainPage.overlay.genealogy')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ContentPreview);