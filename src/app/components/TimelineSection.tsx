'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const TimelineSection: React.FC = () => {
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
      { threshold: 0.2 }
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

  const timelineEvents = [
    {
      year: "1933",
      title: t('timeline.boycott1933'),
      impact: "Initial economic pressure",
      color: "#ffcb51"
    },
    {
      year: "1935", 
      title: t('timeline.laws1935'),
      impact: "Legal restrictions imposed",
      color: "#ffcb51"
    },
    {
      year: "1938",
      title: t('timeline.aryanization1938'),
      impact: "Forced business transfers",
      color: "#eca27d"
    },
    {
      year: "1938",
      title: t('timeline.kristallnacht1938'),
      impact: "Physical destruction",
      color: "#ee5760"
    },
    {
      year: "1941-45",
      title: t('timeline.final1941'),
      impact: "Complete elimination",
      color: "#ee5760"
    }
  ];

  return (
    <section ref={sectionRef} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-mono text-[#f5cdb4] mb-4">
            {t('timeline.title')}
          </h2>
          <p className="text-[#8b7d8e] font-['Inter']">
            {t('timeline.subtitle')}
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#6b6275]"></div>
          
          {/* Timeline events */}
          <div className="space-y-8">
            {timelineEvents.map((event, index) => (
              <div 
                key={index}
                className={`relative flex items-start transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
                style={{ 
                  transitionDelay: `${index * 200}ms` 
                }}
              >
                {/* Timeline dot */}
                <div 
                  className="relative z-10 w-4 h-4 border-2 bg-[#4a4a57] flex-shrink-0 mt-1"
                  style={{ 
                    borderColor: event.color,
                    boxShadow: `0 0 0 4px ${event.color}20`
                  }}
                ></div>
                
                {/* Content */}
                <div className="ml-8 bg-[#4a4a57]/50 border border-[#6b6275] p-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span 
                      className="font-mono text-xl font-bold"
                      style={{ color: event.color }}
                    >
                      {event.year}
                    </span>
                    <span className="text-xs font-mono text-[#8b7d8e] uppercase tracking-wide">
                      {event.impact}
                    </span>
                  </div>
                  <p className="text-[#f5cdb4] font-['Inter'] text-sm leading-relaxed">
                    {event.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary note */}
        <div className="mt-12 text-center">
          <p className="text-[#8b7d8e] font-['Inter'] text-sm max-w-3xl mx-auto">
            This timeline represents the systematic dismantling of Jewish economic life in Berlin. 
            Each event marked a further step in the destruction of a community that had been integral 
            to the city's commercial and cultural fabric for generations.
          </p>
        </div>
      </div>
    </section>
  );
};

export default React.memo(TimelineSection);