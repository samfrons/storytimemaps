'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import StoryList from '../../components/StoryList';
import { useStoryMapLogic, berlinCoordinates, defaultZoom } from '../../../hooks/useStoryMapLogic';

const MapboxMap = dynamic(() => import('../../components/MapboxMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#4a4a57] flex items-center justify-center">
      <div className="text-[#97d8c0] font-mono">Loading map...</div>
    </div>
  )
});

export default function MoodyTheme() {
  const {
    visibleStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers
  } = useStoryMapLogic();

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-[#4a4a57] px-4 py-2 border border-[#6b6275] shadow-lg">
        <h1 className="text-[#97d8c0] font-mono font-bold">MOODY THEME (Current)</h1>
      </div>
      
      {/* Sidebar */}
      <div className="w-full md:w-96 flex-shrink-0 bg-[#4a4a57] border-r border-[#6b6275] relative">
        <StoryList 
          visibleStories={visibleStories}
          activeStoryId={activeStoryId}
          minDate={minDate}
          maxDate={maxDate}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          onStoryClick={handleMarkerClick}
        />
      </div>
      
      {/* Map */}
      <div className="flex-1 relative">
        <MapboxMap 
          center={berlinCoordinates}
          zoom={defaultZoom}
          markers={testMarkers}
          onMarkerClick={handleMarkerClick}
          activeMarkerId={activeStoryId}
          enrichedStories={visibleStories}
        />
      </div>
    </div>
  );
}