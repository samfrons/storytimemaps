'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../i18n/useTranslation';
import LanguageToggle from './LanguageToggle';
import AnimatedBusinessCarousel from './AnimatedBusinessCarousel';
import StatisticsSection from './StatisticsSection';
import BerlinMapGraphic from './BerlinMapGraphic';

interface BusinessFeature {
  properties: {
    name: string;
    business_type?: string;
    address?: string;
    registration_date?: string;
    dissolution_date?: string;
    liquidation_date?: string;
    date_range?: string;
    category?: string;
  };
}

interface StoryMapBusiness {
  id: string;
  title: string;
  description: string;
  address: string;
  startDate: string;
  endDate?: string;
  category: string;
  imageUrls?: string[];
}

interface HomepageProps {
  businessData: BusinessFeature[];
  storyMapData?: StoryMapBusiness[];
}

const Homepage: React.FC<HomepageProps> = ({ businessData, storyMapData }) => {
  const { t } = useTranslation();

  // Process business data for carousel - use storymap data with images
  const carouselBusinesses = useMemo(() => {
    if (storyMapData && storyMapData.length > 0) {
      // Use businesses with images and descriptions
      return storyMapData
        .filter(business => business.imageUrls && business.imageUrls.length > 0)
        .slice(0, 8)
        .map(business => ({
          name: business.title,
          business_type: business.category,
          address: business.address,
          registration_date: business.startDate ? new Date(business.startDate).getFullYear().toString() : 'Unknown',
          dissolution_date: business.endDate ? new Date(business.endDate).getFullYear().toString() : '',
          category: business.category,
          description: business.description,
          imageUrls: business.imageUrls
        }));
    }
    
    // Fallback to geojson data
    const selectedBusinesses = [];
    const categories = new Set();
    
    for (const feature of businessData) {
      const props = feature.properties;
      if (categories.has(props.category)) continue;
      
      selectedBusinesses.push({
        name: props.name,
        business_type: props.business_type || 'Unknown',
        address: props.address || 'Unknown address',
        registration_date: props.registration_date || props.date_range?.split('-')[0] || 'Unknown',
        dissolution_date: props.dissolution_date || props.liquidation_date || '',
        category: props.category || 'Unknown'
      });
      
      categories.add(props.category);
      if (selectedBusinesses.length >= 8) break;
    }
    
    return selectedBusinesses;
  }, [businessData, storyMapData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const categories: { [key: string]: number } = {};
    const yearCounts: { [key: string]: number } = {};
    
    businessData.forEach((feature) => {
      const props = feature.properties;
      
      // Count categories
      const category = props.category || 'Unknown';
      categories[category] = (categories[category] || 0) + 1;
      
      // Count by registration year
      if (props.registration_date) {
        const year = props.registration_date.toString();
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });

    // Find peak year
    let peakYear = { year: 1930, count: 0 };
    Object.entries(yearCounts).forEach(([year, count]) => {
      if (count > peakYear.count) {
        peakYear = { year: parseInt(year), count };
      }
    });

    return {
      totalBusinesses: businessData.length,
      timeSpanStart: 1900,
      timeSpanEnd: 1945,
      categories,
      peakYear
    };
  }, [businessData]);

  return (
    <div className="min-h-screen bg-[#4a4a57]">
      {/* Hero Section */}
      <header className="relative">
        <div className="absolute top-4 right-4 z-10">
          <LanguageToggle />
        </div>
        
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-mono text-[#f5cdb4] mb-4 animate-fadeIn">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-[#8b7d8e] font-mono mb-2 animate-fadeIn animation-delay-200">
              {t('hero.subtitle')}
            </p>
            <p className="text-lg text-[#97d8c0] font-mono animate-fadeIn animation-delay-400">
              {t('hero.period')}
            </p>
          </div>
        </div>
      </header>

      {/* Introduction Section with Map Graphic */}
      <section className="py-16 px-4 bg-[#3b3340]/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-mono text-[#f5cdb4] mb-8 text-center">
            {t('intro.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6 text-[#f5cdb4]/90 leading-relaxed font-['Inter'] text-base">
              <p className="animate-fadeIn animation-delay-600">
                {t('intro.paragraph1')}
              </p>
              <p className="animate-fadeIn animation-delay-800">
                {t('intro.paragraph2')}
              </p>
              <p className="animate-fadeIn animation-delay-1000">
                {t('intro.paragraph3')}
              </p>
            </div>
            
            {/* Map Graphic */}
            <div className="animate-fadeIn animation-delay-800">
              <h3 className="text-xl font-mono text-[#97d8c0] mb-4 text-center">
                {t('intro.mapTitle')}
              </h3>
              <div className="h-[400px] bg-[#3b3340]/20 border border-[#6b6275] p-4">
                <BerlinMapGraphic />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Carousel Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-mono text-[#f5cdb4] mb-4 text-center">
            {t('preview.title')}
          </h2>
          <p className="text-center text-[#8b7d8e] mb-12">
            {t('preview.subtitle')}
          </p>
          <AnimatedBusinessCarousel businesses={carouselBusinesses} />
        </div>
      </section>

      {/* Statistics Section */}
      <StatisticsSection {...statistics} />

      {/* Call to Action */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Link 
            href="/"
            className="inline-block px-8 py-4 bg-[#97d8c0] text-[#2a2a2a] font-mono text-lg hover:bg-[#a9e2d0] transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-transform"
          >
            {t('cta.exploreMap')}
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default React.memo(Homepage);