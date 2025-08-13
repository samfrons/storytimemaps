'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const InsightsSection: React.FC = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const insights = [
    {
      title: t('insights.peakPeriod'),
      description: t('insights.peakDesc'),
      visual: (
        <div className="flex items-end gap-1 h-16">
          {[8, 12, 16, 20, 18, 15, 8, 4, 2, 1].map((height, i) => (
            <div
              key={i}
              className="bg-[#97d8c0] w-3 transition-all duration-1000"
              style={{ 
                height: `${height * 3}px`,
                transitionDelay: `${i * 100}ms`,
                opacity: isVisible ? 1 : 0
              }}
            />
          ))}
        </div>
      ),
      color: "text-[#97d8c0]"
    },
    {
      title: t('insights.geographic'),
      description: t('insights.geographicDesc'),
      visual: (
        <div className="grid grid-cols-4 gap-1 h-16">
          {[
            [3, 2, 1, 2], [4, 5, 3, 2], [2, 4, 6, 4], [1, 2, 3, 2]
          ].map((row, i) => 
            row.map((intensity, j) => (
              <div
                key={`${i}-${j}`}
                className="bg-[#ffcb51] transition-all duration-1000"
                style={{ 
                  opacity: isVisible ? intensity * 0.2 : 0,
                  transitionDelay: `${(i * 4 + j) * 50}ms`
                }}
              />
            ))
          )}
        </div>
      ),
      color: "text-[#ffcb51]"
    },
    {
      title: t('insights.decline'),
      description: t('insights.declineDesc'),
      visual: (
        <div className="flex flex-col gap-2 h-16">
          <div className="flex gap-1">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[#eca27d] transition-all duration-1000"
                style={{
                  opacity: isVisible && i < 3 ? 1 : isVisible ? 0.3 : 0,
                  transitionDelay: `${i * 100}ms`
                }}
              />
            ))}
          </div>
          <div className="text-xs font-mono text-[#eca27d] text-center">
            {isVisible ? "3/12 remain" : ""}
          </div>
        </div>
      ),
      color: "text-[#eca27d]"
    },
    {
      title: t('insights.legacy'),
      description: t('insights.legacyDesc'),
      visual: (
        <div className="relative h-16 flex items-center justify-center">
          <div className="text-6xl opacity-20 transition-opacity duration-1000">
            {isVisible ? "∅" : ""}
          </div>
        </div>
      ),
      color: "text-[#ee5760]"
    }
  ];

  return (
    <section ref={sectionRef} className="py-16 px-4 bg-[#3b3340]/10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-mono text-[#f5cdb4] mb-4">
            {t('insights.title')}
          </h2>
          <p className="text-[#8b7d8e] font-['Inter']">
            {t('insights.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="bg-[#4a4a57]/30 border border-[#6b6275] p-6 text-center"
            >
              <div className="mb-4 flex justify-center">
                {insight.visual}
              </div>
              <h3 className={`font-mono text-lg mb-3 ${insight.color}`}>
                {insight.title}
              </h3>
              <p className="text-[#f5cdb4]/80 text-sm font-['Inter'] leading-relaxed">
                {insight.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional context */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-[#6b6275]/20 p-6 border-l-4 border-[#97d8c0]">
            <h4 className="font-mono text-[#97d8c0] mb-3">Business Types</h4>
            <div className="space-y-2 text-sm font-['Inter'] text-[#f5cdb4]/80">
              <div className="flex justify-between">
                <span>Retail & Trade</span>
                <span className="font-mono">45%</span>
              </div>
              <div className="flex justify-between">
                <span>Manufacturing</span>
                <span className="font-mono">28%</span>
              </div>
              <div className="flex justify-between">
                <span>Services</span>
                <span className="font-mono">18%</span>
              </div>
              <div className="flex justify-between">
                <span>Banking & Finance</span>
                <span className="font-mono">9%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#6b6275]/20 p-6 border-l-4 border-[#ffcb51]">
            <h4 className="font-mono text-[#ffcb51] mb-3">Geographic Spread</h4>
            <div className="space-y-2 text-sm font-['Inter'] text-[#f5cdb4]/80">
              <div className="flex justify-between">
                <span>Mitte</span>
                <span className="font-mono">312 businesses</span>
              </div>
              <div className="flex justify-between">
                <span>Charlottenburg</span>
                <span className="font-mono">187 businesses</span>
              </div>
              <div className="flex justify-between">
                <span>Kreuzberg</span>
                <span className="font-mono">156 businesses</span>
              </div>
              <div className="flex justify-between">
                <span>Other districts</span>
                <span className="font-mono">245 businesses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(InsightsSection);