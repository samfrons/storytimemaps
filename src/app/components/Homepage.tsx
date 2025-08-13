'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../i18n/useTranslation';
import LanguageToggle from './LanguageToggle';
import AnimatedBusinessCarousel from './AnimatedBusinessCarousel';
import StatisticsSection from './StatisticsSection';
import BerlinMapPreview from './BerlinMapPreview';
import MethodologySection from './MethodologySection';
import TimelineSection from './TimelineSection';
import InsightsSection from './InsightsSection';
import NavigationGuide from './NavigationGuide';
import ResearchSection from './ResearchSection';
import FutureInitiatives from './FutureInitiatives';

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
      <header className="relative bg-gradient-to-br from-[#4a4a57] via-[#3b3340] to-[#2a2a2a] overflow-hidden">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(245, 205, 180, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(245, 205, 180, 0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        <div className="absolute top-4 right-4 z-10">
          <LanguageToggle />
        </div>
        
        <div className="relative pt-24 pb-20 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-['Inter'] font-light text-[#f5cdb4] mb-6 animate-fadeIn tracking-tight leading-none">
              {t('hero.title')}
            </h1>
            <p className="text-2xl md:text-3xl text-[#97d8c0] font-['Inter'] font-light mb-4 animate-fadeIn animation-delay-200">
              {t('hero.subtitle')}
            </p>
            <div className="inline-block bg-[#97d8c0]/10 border border-[#97d8c0]/30 px-6 py-2 animate-fadeIn animation-delay-400">
              <p className="text-xl text-[#97d8c0] font-mono font-bold tracking-wider">
                {t('hero.period')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Introduction Section with Map Graphic */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#f5cdb4]/5 to-[#97d8c0]/5 relative">
        {/* Decorative accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#97d8c0] via-[#ffcb51] to-[#eca27d]"></div>
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-['Inter'] font-light text-[#f5cdb4] mb-4">
              {t('intro.title')}
            </h2>
            <div className="w-24 h-1 bg-[#97d8c0] mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <p className="text-lg leading-relaxed font-['Inter'] text-[#f5cdb4] animate-fadeIn animation-delay-600">
                {t('intro.paragraph1')}
              </p>
              <p className="text-lg leading-relaxed font-['Inter'] text-[#f5cdb4]/90 animate-fadeIn animation-delay-800">
                {t('intro.paragraph2')}
              </p>
              <p className="text-lg leading-relaxed font-['Inter'] text-[#f5cdb4]/90 animate-fadeIn animation-delay-1000">
                {t('intro.paragraph3')}
              </p>
            </div>
            
            {/* Map Graphic */}
            <div className="animate-fadeIn animation-delay-800">
              <div className="bg-[#2a2a2a] p-6 border-l-4 border-[#97d8c0] shadow-2xl">
                <h3 className="text-2xl font-['Inter'] font-medium text-[#97d8c0] mb-6 text-center">
                  {t('intro.mapTitle')}
                </h3>
                <div className="h-[400px] bg-[#1a1a1a] border border-[#6b6275] overflow-hidden">
                  <BerlinMapPreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Carousel Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#2a2a2a] to-[#4a4a57] relative overflow-hidden">
        {/* Decorative pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
          <div className="w-full h-full bg-gradient-to-bl from-[#97d8c0] to-transparent transform rotate-45"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-['Inter'] font-light text-[#f5cdb4] mb-4">
              {t('preview.title')}
            </h2>
            <p className="text-xl text-[#97d8c0] font-['Inter'] font-light">
              {t('preview.subtitle')}
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-[#97d8c0] to-[#ffcb51] mx-auto mt-6"></div>
          </div>
          <AnimatedBusinessCarousel businesses={carouselBusinesses} />
        </div>
      </section>

      {/* Statistics Section */}
      <StatisticsSection {...statistics} />

      {/* Methodology Section */}
      <MethodologySection />

      {/* Timeline Section */} 
      <TimelineSection />

      {/* Data Insights Section */}
      <InsightsSection />

      {/* Navigation Guide */}
      <NavigationGuide />

      {/* Research Foundation */}
      <ResearchSection />

      {/* Future Initiatives */}
      <FutureInitiatives />

      {/* Enhanced Call to Action */}
      <section className="py-24 px-4 bg-gradient-to-br from-[#97d8c0]/10 via-[#4a4a57] to-[#2a2a2a] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#97d8c0] to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-tl from-[#ffcb51] to-transparent rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative">
          <h2 className="text-5xl md:text-6xl font-['Inter'] font-light text-[#f5cdb4] mb-8 leading-tight">
            Ready to Explore?
          </h2>
          <p className="text-xl md:text-2xl text-[#97d8c0] font-['Inter'] font-light mb-12 max-w-3xl mx-auto leading-relaxed">
            Step into Berlin's past and discover the stories of thousands of Jewish businesses 
            that once formed the heart of the city's commercial life.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link 
              href="/"
              className="group inline-block px-12 py-5 bg-gradient-to-r from-[#97d8c0] to-[#a9e2d0] text-[#1a1a1a] font-['Inter'] font-semibold text-xl hover:from-[#a9e2d0] hover:to-[#97d8c0] transition-all duration-300 shadow-2xl hover:shadow-[#97d8c0]/25 transform hover:-translate-y-2 hover:scale-105"
            >
              <span className="flex items-center gap-3">
                {t('cta.exploreMap')}
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
            
            <Link 
              href="/jewish-businesses"
              className="group inline-block px-12 py-5 bg-transparent border-3 border-[#f5cdb4] text-[#f5cdb4] font-['Inter'] font-semibold text-xl hover:bg-[#f5cdb4] hover:text-[#2a2a2a] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="flex items-center gap-3">
                {t('cta.viewData')}
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
            </Link>
          </div>

          <div className="bg-[#2a2a2a]/60 backdrop-blur-sm p-8 border border-[#6b6275]/30">
            <p className="text-[#f5cdb4]/80 font-['Inter'] text-lg leading-relaxed">
              This project is part of <strong className="text-[#97d8c0]">StoryTimeMaps'</strong> ongoing work to make historical data accessible. 
              For academic use and citations, please reference <strong className="text-[#ffcb51]">Dr. Kreutzmüller's</strong> original research.
            </p>
          </div>
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