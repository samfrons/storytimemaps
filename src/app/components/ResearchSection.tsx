'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const ResearchSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#2a2a2a] via-[#3b3340] to-[#4a4a57] relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#97d8c0] via-[#ffcb51] to-[#eca27d]"></div>
      <div className="absolute bottom-12 left-12 w-32 h-32 border-2 border-[#97d8c0]/20 transform rotate-12"></div>
      
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-['Inter'] font-light text-[#f5cdb4] mb-4">
            {t('research.title')}
          </h2>
          <p className="text-xl text-[#97d8c0] font-['Inter'] font-light max-w-2xl mx-auto">
            {t('research.subtitle')}
          </p>
          <div className="w-48 h-1 bg-gradient-to-r from-[#97d8c0] to-[#eca27d] mx-auto mt-6"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Dr. Kreutzmüller's Work */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-8 border-l-8 border-[#97d8c0] shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">📚</div>
              <div>
                <h3 className="text-2xl font-['Inter'] font-semibold text-[#97d8c0] mb-3">
                  {t('research.kreutzmuller.title')}
                </h3>
              </div>
            </div>
            <p className="text-[#f5cdb4] font-['Inter'] text-lg leading-relaxed mb-6">
              {t('research.kreutzmuller.description')}
            </p>
            <p className="text-[#f5cdb4]/90 font-['Inter'] leading-relaxed mb-8">
              {t('research.kreutzmuller.methodology')}
            </p>
            
            {/* Book link */}
            <div className="bg-[#97d8c0]/10 p-6 border border-[#97d8c0]/30">
              <h4 className="font-['Inter'] font-semibold text-[#97d8c0] mb-3">📖 Essential Reading</h4>
              <p className="text-[#f5cdb4] font-['Inter'] mb-4">
                <strong>"Final Sale: The Destruction of Jewish Commercial Activity in Nazi Germany"</strong> (2015)
              </p>
              <a 
                href="https://www.berghahnbooks.com/title/KreutzmllerFinal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-[#97d8c0] text-[#1a1a1a] font-['Inter'] font-semibold hover:bg-[#a9e2d0] transition-colors duration-200"
              >
                {t('cta.buyBook')} →
              </a>
            </div>
          </div>

          {/* Leo Baeck Institute */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-8 border-l-8 border-[#ffcb51] shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">🏛️</div>
              <div>
                <h3 className="text-2xl font-['Inter'] font-semibold text-[#ffcb51] mb-3">
                  {t('research.database.title')}
                </h3>
              </div>
            </div>
            <p className="text-[#f5cdb4] font-['Inter'] text-lg leading-relaxed mb-6">
              {t('research.database.description')}
            </p>
            <p className="text-[#f5cdb4]/90 font-['Inter'] leading-relaxed mb-8">
              {t('research.database.scope')}
            </p>
            
            {/* Database link */}
            <div className="bg-[#ffcb51]/10 p-6 border border-[#ffcb51]/30">
              <h4 className="font-['Inter'] font-semibold text-[#ffcb51] mb-3">🗃️ Academic Database</h4>
              <p className="text-[#f5cdb4] font-['Inter'] mb-4">
                Access the comprehensive research database maintained by the Leo Baeck Institute
              </p>
              <a 
                href="https://www.leobaeck.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-[#ffcb51] text-[#1a1a1a] font-['Inter'] font-semibold hover:bg-[#ffd96b] transition-colors duration-200"
              >
                {t('cta.leoBackInstitute')} →
              </a>
            </div>
          </div>
        </div>

        {/* Transformation */}
        <div className="bg-gradient-to-r from-[#eca27d]/10 to-[#97d8c0]/10 p-8 border border-[#eca27d]/30 mb-16">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🌐</div>
            <div>
              <h3 className="text-2xl font-['Inter'] font-semibold text-[#eca27d] mb-4">
                {t('research.transformation.title')}
              </h3>
              <p className="text-[#f5cdb4] font-['Inter'] text-lg leading-relaxed">
                {t('research.transformation.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Citation guidance */}
        <div className="bg-[#6b6275]/20 p-8 border-l-4 border-[#f5cdb4]">
          <h4 className="font-['Inter'] font-semibold text-[#f5cdb4] text-lg mb-4">📝 Academic Citation</h4>
          <div className="bg-[#2a2a2a]/60 p-6 font-mono text-sm text-[#97d8c0] leading-relaxed border border-[#6b6275]">
            <p className="mb-3">
              <strong>Original Research:</strong><br/>
              Kreutzmüller, Christoph. <em>Final Sale: The Destruction of Jewish Commercial Activity in Nazi Germany.</em> Berghahn Books, 2015.
            </p>
            <p>
              <strong>Digital Implementation:</strong><br/>
              StoryTimeMaps. <em>Bygone Berlin Businesses: Jewish Commercial Life 1900-1945.</em> Based on research by Christoph Kreutzmüller and the Leo Baeck Institute. {new Date().getFullYear()}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(ResearchSection);