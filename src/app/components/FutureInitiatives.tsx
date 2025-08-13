'use client';

import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

const FutureInitiatives: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 bg-gradient-to-tr from-[#ee5760]/5 via-[#4a4a57] to-[#97d8c0]/5 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#ee5760]/10 to-transparent transform rotate-45"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#97d8c0]/10 to-transparent"></div>
      
      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-['Inter'] font-light text-[#f5cdb4] mb-4">
            {t('future.title')}
          </h2>
          <p className="text-xl text-[#ee5760] font-['Inter'] font-light max-w-2xl mx-auto">
            {t('future.subtitle')}
          </p>
          <div className="w-56 h-1 bg-gradient-to-r from-[#ee5760] via-[#eca27d] to-[#97d8c0] mx-auto mt-6"></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Memorial Plaques */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-8 border-l-8 border-[#ee5760] shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">🏛️</div>
              <div>
                <h3 className="text-2xl font-['Inter'] font-semibold text-[#ee5760] mb-3">
                  {t('future.plaques.title')}
                </h3>
              </div>
            </div>
            
            <p className="text-[#f5cdb4] font-['Inter'] text-lg leading-relaxed mb-6">
              {t('future.plaques.description')}
            </p>
            
            <p className="text-[#f5cdb4]/90 font-['Inter'] leading-relaxed mb-8">
              {t('future.plaques.vision')}
            </p>

            {/* Stolpersteine connection */}
            <div className="bg-[#ee5760]/10 p-6 border border-[#ee5760]/30 mb-6">
              <h4 className="font-['Inter'] font-semibold text-[#ee5760] mb-3">🪨 Inspired by Stolpersteine</h4>
              <p className="text-[#f5cdb4] font-['Inter'] mb-4">
                Like Gunter Demnig&apos;s powerful Stolpersteine project, which commemorates individuals, 
                our memorial plaques would honor the <strong>commercial spaces</strong> where Jewish families 
                built their livelihoods and served their communities.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="text-[#ee5760] font-semibold mb-2">Stolpersteine Focus:</h5>
                  <ul className="text-[#f5cdb4]/80 space-y-1">
                    <li>• Individual victims</li>
                    <li>• Residential addresses</li>
                    <li>• Personal stories</li>
                    <li>• Family deportations</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-[#ee5760] font-semibold mb-2">Business Plaques Focus:</h5>
                  <ul className="text-[#f5cdb4]/80 space-y-1">
                    <li>• Commercial enterprises</li>
                    <li>• Business locations</li>
                    <li>• Economic persecution</li>
                    <li>• Community impact</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Mockup of plaque */}
            <div className="bg-[#6b6275] p-6 border-2 border-[#8b7d8e] text-center">
              <div className="text-[#f5cdb4] font-mono text-sm leading-tight">
                <div className="mb-2 text-[#ee5760] font-bold">HIER STAND</div>
                <div className="text-lg font-bold mb-1">PELZ FURRIER</div>
                <div className="mb-2">Eigentümer: Familie Pelz</div>
                <div className="text-xs mb-2">1918-1937</div>
                <div className="text-xs">Zwangsschließung • Arisiert</div>
              </div>
            </div>
          </div>

          {/* Community & Expansion */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-6 border-l-8 border-[#97d8c0] shadow-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">👥</div>
                <h3 className="text-xl font-['Inter'] font-semibold text-[#97d8c0]">
                  {t('future.community.title')}
                </h3>
              </div>
              <p className="text-[#f5cdb4] font-['Inter'] leading-relaxed">
                {t('future.community.description')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-6 border-l-8 border-[#eca27d] shadow-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">🗺️</div>
                <h3 className="text-xl font-['Inter'] font-semibold text-[#eca27d]">
                  {t('future.expansion.title')}
                </h3>
              </div>
              <p className="text-[#f5cdb4] font-['Inter'] leading-relaxed">
                {t('future.expansion.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Call to action for support */}
        <div className="bg-gradient-to-r from-[#ee5760]/10 to-[#97d8c0]/10 p-8 border-2 border-[#ee5760]/30 text-center">
          <h4 className="text-2xl font-['Inter'] font-semibold text-[#f5cdb4] mb-4">
            Help Bring These Memorials to Life
          </h4>
          <p className="text-[#f5cdb4]/90 font-['Inter'] text-lg mb-6 max-w-3xl mx-auto">
            We&apos;re seeking partnerships with Berlin&apos;s cultural institutions, educational organizations, 
            and community groups to make memorial plaques a reality. This initiative requires collaboration 
            with city planning, historical preservation, and Jewish community organizations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:info@storytimemaps.com?subject=Memorial Plaques Initiative"
              className="inline-block px-8 py-4 bg-[#ee5760] text-white font-['Inter'] font-semibold text-lg hover:bg-[#f06570] transition-colors duration-300 shadow-lg"
            >
              {t('cta.supportPlaques')}
            </a>
            <a 
              href="https://www.stolpersteine.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-transparent border-2 border-[#97d8c0] text-[#97d8c0] font-['Inter'] font-semibold text-lg hover:bg-[#97d8c0] hover:text-[#1a1a1a] transition-all duration-300"
            >
              Learn About Stolpersteine
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(FutureInitiatives);