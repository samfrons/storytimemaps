'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import StoryList from './components/StoryList';
import { useStoryMapLogic, berlinCoordinates, defaultZoom } from '../hooks/useStoryMapLogic';

const Map = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
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

  const handleStoryClick = (storyId: string) => {
    setActiveStoryId(storyId);
    handleMarkerClick(storyId);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-slate-950">
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
        <Map
          center={berlinCoordinates}
          zoom={defaultZoom}
          markers={testMarkers}
          onMarkerClick={handleStoryClick}
          activeMarkerId={activeStoryId}
          currentDate={currentDate}
        />
      </div>
    </div>
  );
}