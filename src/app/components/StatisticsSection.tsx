'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

interface StatisticsSectionProps {
  totalBusinesses: number;
  timeSpanStart: number;
  timeSpanEnd: number;
  categories: { [key: string]: number };
  peakYear: { year: number; count: number };
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({
  totalBusinesses,
  timeSpanStart,
  timeSpanEnd,
  categories,
  peakYear
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    businesses: 0,
    years: 0,
    categories: 0,
    peakCount: 0
  });
  const sectionRef = useRef<HTMLDivElement>(null);

  // Calculate total categories
  const totalCategories = useMemo(() => Object.keys(categories).length, [categories]);

  // Intersection observer to trigger animation
  useEffect(() => {
    const currentRef = sectionRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isVisible]);

  // Animate numbers when visible
  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);

      setAnimatedValues({
        businesses: Math.floor(totalBusinesses * easeOutQuart),
        years: Math.floor((timeSpanEnd - timeSpanStart) * easeOutQuart),
        categories: Math.floor(totalCategories * easeOutQuart),
        peakCount: Math.floor(peakYear.count * easeOutQuart)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedValues({
          businesses: totalBusinesses,
          years: timeSpanEnd - timeSpanStart,
          categories: totalCategories,
          peakCount: peakYear.count
        });
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [isVisible, totalBusinesses, timeSpanStart, timeSpanEnd, totalCategories, peakYear]);

  return (
    <div ref={sectionRef} className="w-full py-16 bg-[#3b3340]/20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-mono text-[#f5cdb4] mb-12 text-center">
          {t('statistics.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Total Businesses */}
          <div className="text-center">
            <div className="text-5xl font-mono text-[#97d8c0] mb-2">
              {animatedValues.businesses.toLocaleString()}
            </div>
            <div className="text-sm font-mono text-[#8b7d8e] uppercase">
              {t('statistics.totalBusinesses')}
            </div>
          </div>

          {/* Time Span */}
          <div className="text-center">
            <div className="text-5xl font-mono text-[#ffcb51] mb-2">
              {animatedValues.years}
            </div>
            <div className="text-sm font-mono text-[#8b7d8e] uppercase">
              {t('statistics.timeSpan')}
            </div>
            <div className="text-xs text-[#6b6275] mt-1">
              {timeSpanStart} - {timeSpanEnd}
            </div>
          </div>

          {/* Categories */}
          <div className="text-center">
            <div className="text-5xl font-mono text-[#eca27d] mb-2">
              {animatedValues.categories}
            </div>
            <div className="text-sm font-mono text-[#8b7d8e] uppercase">
              {t('statistics.categories')}
            </div>
          </div>

          {/* Peak Year */}
          <div className="text-center">
            <div className="text-5xl font-mono text-[#ee5760] mb-2">
              {peakYear.year}
            </div>
            <div className="text-sm font-mono text-[#8b7d8e] uppercase">
              {t('statistics.peakYear')}
            </div>
            <div className="text-xs text-[#6b6275] mt-1">
              {animatedValues.peakCount.toLocaleString()} {t('statistics.totalBusinesses').toLowerCase()}
            </div>
          </div>
        </div>

        {/* Categories breakdown */}
        {isVisible && (
          <div className="mt-12 pt-8 border-t border-[#6b6275]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(categories)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([category, count], index) => (
                  <div 
                    key={category}
                    className="flex justify-between items-center p-3 bg-[#6b6275]/20 border border-[#6b6275]/40"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <span className="text-xs font-mono text-[#f5cdb4] truncate mr-2">
                      {category}
                    </span>
                    <span className="text-xs font-mono text-[#97d8c0]">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(StatisticsSection);