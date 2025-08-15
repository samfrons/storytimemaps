'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import StoryList from '../components/StoryList';
import { useStoryMapLogic, berlinCoordinates, defaultZoom } from '../../hooks/useStoryMapLogic';


const MapboxMap = dynamic(() => import('../components/MapboxMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
      <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading map...</div>
    </div>
  )
});

interface ThemePageProps {
  params: Promise<{
    theme: string;
  }>;
}

export default function ThemePage({ params }: ThemePageProps) {
  const { setTheme } = useTheme();
  const [theme, setThemeParam] = React.useState<string | null>(null);
  const {
    visibleStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers,
    setActiveStoryId
  } = useStoryMapLogic();

  const validThemes = ['moody', 'cool', 'warm', 'hot', 'cold', 'bauhaus', 'art-nouveau'];

  useEffect(() => {
    params.then(({ theme }) => {
      if (validThemes.includes(theme)) {
        setTheme(theme);
        setThemeParam(theme);
      } else {
        notFound();
      }
    });
  }, [params, setTheme]);

  if (!theme) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="font-mono" style={{ color: 'var(--primary)' }}>Loading...</div>
      </div>
    );
  }

  const handleStoryClick = (storyId: string) => {
    setActiveStoryId(storyId);
    handleMarkerClick(storyId);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full md:w-1/3 h-1/2 md:h-screen order-2 md:order-1">
        <StoryList
          visibleStories={visibleStories}
          activeStoryId={activeStoryId}
          minDate={minDate}
          maxDate={maxDate}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          onStoryClick={handleStoryClick}
        />
      </div>
      <div className="w-full md:w-2/3 h-1/2 md:h-screen order-1 md:order-2 relative">
        <MapboxMap
          center={berlinCoordinates}
          zoom={defaultZoom}
          markers={testMarkers}
          onMarkerClick={handleStoryClick}
          activeMarkerId={activeStoryId}
          currentDate={currentDate}
          enrichedStories={visibleStories}
        />
      </div>
    </div>
  );
}