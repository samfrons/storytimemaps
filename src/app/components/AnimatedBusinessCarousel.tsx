'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useTranslation } from '../../i18n/useTranslation';

interface Business {
  name: string;
  business_type: string;
  address: string;
  registration_date: string;
  dissolution_date: string;
  category: string;
  state?: 'active' | 'declining' | 'closed';
  description?: string;
  imageUrls?: string[];
}

interface AnimatedBusinessCarouselProps {
  businesses: Business[];
}

const AnimatedBusinessCarousel: React.FC<AnimatedBusinessCarouselProps> = ({ businesses }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { t } = useTranslation();

  // Auto-cycle through businesses
  useEffect(() => {
    if (isPaused || businesses.length === 0) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % businesses.length);
        setIsTransitioning(false);
      }, 300);
    }, 4500);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, businesses.length]);

  const currentBusiness = useMemo(() => {
    if (!businesses[currentIndex]) return null;
    const business = businesses[currentIndex];
    
    // Determine state based on dates
    let state: 'active' | 'declining' | 'closed' = 'active';
    if (business.dissolution_date && business.dissolution_date !== '') {
      const year = parseInt(business.dissolution_date);
      if (year <= 1938) {
        state = 'closed';
      } else if (year <= 1933) {
        state = 'declining';
      }
    }
    
    return { ...business, state };
  }, [currentIndex, businesses]);

  if (!currentBusiness) return null;

  const getStateColor = (state: string) => {
    switch (state) {
      case 'active': return 'text-[#97d8c0] border-[#97d8c0]';
      case 'declining': return 'text-[#ffcb51] border-[#ffcb51]';
      case 'closed': return 'text-[#ee5760] border-[#ee5760]';
      default: return 'text-[#f5cdb4] border-[#6b6275]';
    }
  };

  const getStateBg = (state: string) => {
    switch (state) {
      case 'active': return 'bg-[#97d8c0]/10';
      case 'declining': return 'bg-[#ffcb51]/10';
      case 'closed': return 'bg-[#ee5760]/10';
      default: return 'bg-[#6b6275]/10';
    }
  };

  return (
    <div 
      className="relative w-full max-w-2xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className={`border-2 ${getStateColor(currentBusiness.state || 'active')} ${getStateBg(currentBusiness.state || 'active')}`}>
          {/* Image section if available */}
          {currentBusiness.imageUrls && currentBusiness.imageUrls.length > 0 && (
            <div className="relative h-64 bg-[#2a2a2a] overflow-hidden">
              <Image 
                src={currentBusiness.imageUrls[0]}
                alt={currentBusiness.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority={currentIndex === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#4a4a57]/80 to-transparent" />
            </div>
          )}
          
          <div className="p-8">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-2xl font-mono text-[#f5cdb4]">
                {currentBusiness.name}
              </h3>
              <span className={`px-3 py-1 text-xs font-mono uppercase ${getStateColor(currentBusiness.state || 'active')} border`}>
                {t(`businessStates.${currentBusiness.state || 'active'}`)}
              </span>
            </div>
            
            {/* Description if available */}
            {currentBusiness.description && (
              <p className="text-[#f5cdb4]/80 text-sm mb-4 font-['Inter'] leading-relaxed">
                {currentBusiness.description}
              </p>
            )}
            
            <div className="space-y-3 text-[#8b7d8e] font-mono text-sm">
              <div>
                <span className="text-[#f5cdb4]">Type:</span> {currentBusiness.business_type}
              </div>
              <div>
                <span style={{ color: 'var(--foreground-muted)' }}>Address:</span> {currentBusiness.address}
              </div>
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--foreground-muted)' }}>{t('common.registered')}:</span> {currentBusiness.registration_date || t('common.unknown')}
                {currentBusiness.dissolution_date && (
                  <>
                    <span style={{ color: 'var(--foreground-muted)' }} className="ml-4">{t('common.closed')}:</span> {currentBusiness.dissolution_date}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {businesses.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsTransitioning(false);
              }, 300);
            }}
            className={`h-2 transition-all duration-300 ${
              index === currentIndex 
                ? 'w-8 bg-[#97d8c0]' 
                : 'w-2 bg-[#6b6275] hover:bg-[#8b7d8e]'
            }`}
            aria-label={`Go to business ${index + 1}`}
          />
        ))}
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-2 right-2 text-xs text-[#8b7d8e] font-mono">
          PAUSED
        </div>
      )}
    </div>
  );
};

export default React.memo(AnimatedBusinessCarousel);