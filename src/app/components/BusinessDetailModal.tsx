'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoryMap } from '../../types';
import StoryDetail from './StoryDetail';
import { useTranslation } from '../../i18n/useTranslation';

interface BusinessDetailModalProps {
  story: StoryMap;
  isOpen: boolean;
  onClose: () => void;
  originRect: DOMRect | null;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({ 
  story, 
  isOpen, 
  onClose, 
  originRect,
  onNavigate,
  hasPrevious = false,
  hasNext = false
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && originRect) {
      setIsVisible(true);
      // Start expansion after a frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(true);
          // Show content after expansion starts
          setTimeout(() => setShowContent(true), 300);
        });
      });
    } else if (!isOpen) {
      setShowContent(false);
      setIsExpanded(false);
      setTimeout(() => setIsVisible(false), 500);
    }
  }, [isOpen, originRect]);

  // Handle story changes with fade transition
  useEffect(() => {
    if (isTransitioning) {
      setShowContent(false);
      setTimeout(() => {
        setShowContent(true);
        setIsTransitioning(false);
      }, 300);
    }
  }, [story.id, isTransitioning]);

  if (!isVisible || !originRect) return null;

  // Calculate the transform origin and initial position
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const modalWidth = Math.min(800, viewportWidth * 0.9); // 90% of viewport width, max 800px
  const modalHeight = viewportHeight * 0.95; // 95% of viewport height
  
  const initialScaleX = originRect.width / modalWidth;
  const initialScaleY = originRect.height / modalHeight;

  const handleNavigate = (direction: 'prev' | 'next') => {
    setIsTransitioning(true);
    onNavigate?.(direction);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black backdrop-blur-md transition-all duration-500 ease-out ${
          isExpanded ? 'bg-opacity-70' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Expanding Modal */}
      <div 
        ref={modalRef}
        className="fixed shadow-2xl transition-all duration-700 ease-out overflow-hidden"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)',
          borderWidth: '1px',
          borderStyle: 'solid',
          width: `${modalWidth}px`,
          height: `${modalHeight}px`,
          left: '50%',
          top: '50%',
          transform: isExpanded 
            ? `translate(-50%, -50%) scale(1)` 
            : `translate(-50%, -50%) translate(${(originRect.left + originRect.width/2 - viewportWidth/2)}px, ${(originRect.top + originRect.height/2 - viewportHeight/2)}px) scale(${initialScaleX}, ${initialScaleY})`,
          transformOrigin: 'center',
          transitionTimingFunction: isExpanded 
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' 
            : 'cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div 
          className={`flex items-center justify-between p-6 border-b transition-opacity duration-300 ${
            showContent && !isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            borderBottomColor: 'var(--border)',
            backgroundColor: 'var(--background)'
          }}
        >
          <div className="flex-1">
            <h2 
              className="text-xl font-mono font-bold mb-1"
              style={{ color: 'var(--primary)' }}
            >
              {story.title}
            </h2>
            <div 
              className="flex items-center gap-4 text-xs font-mono"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <span style={{ color: 'var(--accent-orange)' }}>
                {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} - {story.endDate === 'Unknown' ? 'Unknown' : (story.endDate ? new Date(story.endDate).getFullYear() : 'Unknown')}
              </span>
              {story.category && (
                <span 
                  className="px-2 py-1 uppercase tracking-wide"
                  style={{ 
                    backgroundColor: 'rgba(var(--muted-rgb), 0.5)',
                    color: 'var(--accent-orange)'
                  }}
                >
                  {story.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(var(--muted-rgb), 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg 
              className="w-5 h-5 transition-colors duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--foreground-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--foreground)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--foreground-muted)';
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div 
          className={`p-6 overflow-y-auto h-[calc(100%-88px)] transition-opacity duration-300 ${
            showContent && !isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <StoryDetail story={story} />
          
          {/* Navigation Buttons */}
          <div 
            className="mt-6 pt-6 border-t"
            style={{ borderTopColor: 'var(--border)' }}
          >
            <div className="flex gap-3">
              <button 
                onClick={() => handleNavigate('prev')}
                disabled={!hasPrevious || isTransitioning}
                className="flex-1 font-mono text-xs font-semibold py-3 px-4 border transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: hasPrevious && !isTransitioning ? 'var(--background)' : 'rgba(var(--background-rgb), 0.5)',
                  borderColor: hasPrevious && !isTransitioning ? 'var(--border)' : 'rgba(var(--muted-rgb), 0.3)',
                  color: hasPrevious && !isTransitioning ? 'var(--foreground)' : 'rgba(var(--foreground-muted), 0.5)',
                  cursor: hasPrevious && !isTransitioning ? 'pointer' : 'not-allowed'
                }}
                onMouseEnter={(e) => {
                  if (hasPrevious && !isTransitioning) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--muted-rgb), 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasPrevious && !isTransitioning) {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                  }
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('mainPage.storyDetails.previous')}
              </button>
              
              <button 
                onClick={() => handleNavigate('next')}
                disabled={!hasNext || isTransitioning}
                className="flex-1 font-mono text-xs font-semibold py-3 px-4 border transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: hasNext && !isTransitioning ? 'var(--background)' : 'rgba(var(--background-rgb), 0.5)',
                  borderColor: hasNext && !isTransitioning ? 'var(--border)' : 'rgba(var(--muted-rgb), 0.3)',
                  color: hasNext && !isTransitioning ? 'var(--foreground)' : 'rgba(var(--foreground-muted), 0.5)',
                  cursor: hasNext && !isTransitioning ? 'pointer' : 'not-allowed'
                }}
                onMouseEnter={(e) => {
                  if (hasNext && !isTransitioning) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--muted-rgb), 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasNext && !isTransitioning) {
                    e.currentTarget.style.backgroundColor = 'var(--background)';
                  }
                }}
              >
                {t('mainPage.storyDetails.next')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailModal;