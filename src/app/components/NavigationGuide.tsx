'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const NavigationGuide: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t('navigation.timeSlider'),
      description: t('navigation.timeDesc'),
      icon: (
        <svg viewBox="0 0 100 30" className="w-full h-8">
          <rect x="10" y="13" width="80" height="4" fill="#6b6275" />
          <rect x="10" y="13" width="35" height="4" fill="#97d8c0" />
          <circle cx="45" cy="15" r="4" fill="#97d8c0" />
          <text x="10" y="10" fill="#8b7d8e" fontSize="6" fontFamily="monospace">1900</text>
          <text x="83" y="10" fill="#8b7d8e" fontSize="6" fontFamily="monospace">1945</text>
          <text x="45" y="27" fill="#97d8c0" fontSize="6" fontFamily="monospace" textAnchor="middle">1933</text>
        </svg>
      ),
      color: "border-[#97d8c0]"
    },
    {
      title: t('navigation.markers'),
      description: t('navigation.markersDesc'),
      icon: (
        <svg viewBox="0 0 100 30" className="w-full h-8">
          <circle cx="20" cy="15" r="3" fill="#97d8c0" />
          <circle cx="40" cy="12" r="3" fill="#ffcb51" />
          <circle cx="60" cy="18" r="3" fill="#ee5760" />
          <circle cx="80" cy="15" r="3" fill="#97d8c0" />
          {/* Pulse rings */}
          <circle cx="40" cy="12" r="6" fill="none" stroke="#ffcb51" strokeWidth="0.5" opacity="0.5" />
          <circle cx="40" cy="12" r="9" fill="none" stroke="#ffcb51" strokeWidth="0.3" opacity="0.3" />
        </svg>
      ),
      color: "border-[#ffcb51]"
    },
    {
      title: t('navigation.search'),
      description: t('navigation.searchDesc'),
      icon: (
        <svg viewBox="0 0 100 30" className="w-full h-8">
          <rect x="10" y="10" width="60" height="10" fill="#4a4a57" stroke="#6b6275" strokeWidth="1" />
          <circle cx="80" cy="15" r="6" fill="none" stroke="#eca27d" strokeWidth="1.5" />
          <line x1="84" y1="19" x2="88" y2="23" stroke="#eca27d" strokeWidth="1.5" />
          <text x="15" y="17" fill="#8b7d8e" fontSize="4" fontFamily="monospace">Search businesses...</text>
        </svg>
      ),
      color: "border-[#eca27d]"
    },
    {
      title: t('navigation.stories'),
      description: t('navigation.storiesDesc'),
      icon: (
        <svg viewBox="0 0 100 30" className="w-full h-8">
          <rect x="15" y="5" width="70" height="20" fill="#4a4a57" stroke="#6b6275" strokeWidth="1" />
          <rect x="20" y="8" width="25" height="14" fill="#3b3340" />
          <line x1="50" y1="10" x2="78" y2="10" stroke="#f5cdb4" strokeWidth="0.8" />
          <line x1="50" y1="13" x2="75" y2="13" stroke="#8b7d8e" strokeWidth="0.6" />
          <line x1="50" y1="16" x2="80" y2="16" stroke="#8b7d8e" strokeWidth="0.6" />
          <line x1="50" y1="19" x2="70" y2="19" stroke="#8b7d8e" strokeWidth="0.6" />
        </svg>
      ),
      color: "border-[#f5cdb4]"
    }
  ];

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-mono text-[#f5cdb4] mb-4">
            {t('navigation.title')}
          </h2>
          <p className="text-[#8b7d8e] font-['Inter']">
            {t('navigation.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-[#4a4a57]/30 border-2 ${feature.color} p-6 hover:bg-[#4a4a57]/50 transition-colors duration-300`}
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="font-mono text-lg text-[#f5cdb4] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#f5cdb4]/80 text-sm font-['Inter'] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Pro tips */}
        <div className="mt-12 bg-[#6b6275]/20 p-6 border border-[#6b6275]">
          <h4 className="font-mono text-[#97d8c0] mb-4 text-lg">Pro Tips</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-mono text-[#ffcb51] text-sm mb-2">Time Navigation</h5>
              <ul className="text-[#f5cdb4]/80 text-sm font-['Inter'] space-y-1">
                <li>• Watch businesses open and close in real-time</li>
                <li>• Pause at key historical moments (1933, 1938)</li>
                <li>• Notice clustering patterns change over time</li>
              </ul>
            </div>
            <div>
              <h5 className="font-mono text-[#eca27d] text-sm mb-2">Data Exploration</h5>
              <ul className="text-[#f5cdb4]/80 text-sm font-['Inter'] space-y-1">
                <li>• Filter by business type or district</li>
                <li>• Compare family enterprises vs. corporations</li>
                <li>• Trace individual business journeys</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(NavigationGuide);