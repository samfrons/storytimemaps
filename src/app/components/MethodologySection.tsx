'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const MethodologySection: React.FC = () => {
  const { t } = useTranslation();

  const methods = [
    {
      title: t('methodology.archiveWork'),
      description: t('methodology.archiveDesc'),
      icon: "📚",
      color: "text-[#97d8c0]"
    },
    {
      title: t('methodology.dataProcessing'),
      description: t('methodology.dataDesc'),
      icon: "💾",
      color: "text-[#ffcb51]"
    },
    {
      title: t('methodology.visualization'),
      description: t('methodology.visualizationDesc'),
      icon: "🗺️",
      color: "text-[#eca27d]"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-l from-[#eca27d]/5 to-[#ffcb51]/5 relative">
      {/* Decorative elements */}
      <div className="absolute top-8 left-8 w-32 h-32 border border-[#eca27d]/20 transform rotate-45"></div>
      <div className="absolute bottom-8 right-8 w-24 h-24 bg-gradient-to-br from-[#97d8c0]/10 to-transparent"></div>
      
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-['Inter'] font-light text-[#f5cdb4] mb-4">
            {t('methodology.title')}
          </h2>
          <p className="text-xl text-[#eca27d] font-['Inter'] font-light max-w-2xl mx-auto">
            {t('methodology.subtitle')}
          </p>
          <div className="w-40 h-1 bg-gradient-to-r from-[#eca27d] to-[#ffcb51] mx-auto mt-6"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {methods.map((method, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-[#2a2a2a] to-[#3b3340] border-2 border-[#6b6275] p-8 hover:border-[#eca27d]/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-4 filter drop-shadow-lg">{method.icon}</div>
                <h3 className={`text-xl font-['Inter'] font-medium ${method.color} mb-4`}>
                  {method.title}
                </h3>
              </div>
              <p className="text-[#f5cdb4]/90 text-base font-['Inter'] leading-relaxed text-center">
                {method.description}
              </p>
            </div>
          ))}
        </div>

        {/* Research attribution */}
        <div className="bg-gradient-to-r from-[#97d8c0]/10 to-[#eca27d]/10 p-8 border-l-8 border-[#97d8c0] shadow-lg">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🏛️</div>
            <div>
              <h4 className="font-['Inter'] font-semibold text-[#97d8c0] text-lg mb-3">Research Foundation</h4>
              <p className="text-[#f5cdb4] font-['Inter'] text-lg leading-relaxed">
                This work builds upon <strong>Dr. Christoph Kreutzmüller's</strong> comprehensive research at the <strong>Leo Baeck Institute</strong>, documenting the systematic destruction of Jewish commercial life in Nazi Germany through meticulous analysis of archival materials and survivor testimonies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(MethodologySection);