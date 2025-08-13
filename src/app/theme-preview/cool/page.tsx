'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import StoryList from '../../components/StoryList';
import { useStoryMapLogic, berlinCoordinates, defaultZoom } from '../../../hooks/useStoryMapLogic';

const MapboxMap = dynamic(() => import('./MapboxMapCool'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f0f4f8] flex items-center justify-center">
      <div className="text-[#4a90e2] font-mono">Loading map...</div>
    </div>
  )
});

export default function CoolTheme() {
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
    <div className="flex h-screen overflow-hidden cool-theme">
      <style jsx global>{`
        .cool-theme {
          --primary: #4a90e2;
          --primary-light: #6ba3e7;
          --secondary: #2c5aa0;
          --warning: #f5a623;
          --danger: #d0021b;
          --success: #7ed321;
          --background: #f0f4f8;
          --foreground: #2c3e50;
          --muted: #7f8c8d;
          --border: #bdc3c7;
          --shadow: rgba(0, 0, 0, 0.1);
          --map-overlay: rgba(240, 244, 248, 0.1);
          --accent-orange: #f39c12;
          --accent-yellow: #f1c40f;
          --accent-purple: #9b59b6;
          --accent-coral: #e74c3c;
          --accent-navy: #34495e;
          --accent-chartreuse: #27ae60;
        }
        
        .cool-theme * {
          color: var(--foreground);
          border-color: var(--border);
        }
        
        .cool-theme .bg-\\[\\#4a4a57\\] {
          background-color: var(--background) !important;
        }
        
        .cool-theme .bg-\\[\\#6b6275\\]\\/40 {
          background-color: rgba(74, 144, 226, 0.1) !important;
        }
        
        .cool-theme .border-\\[\\#6b6275\\] {
          border-color: var(--border) !important;
        }
        
        .cool-theme .text-\\[\\#97d8c0\\] {
          color: var(--primary) !important;
        }
        
        .cool-theme .text-\\[\\#f5cdb4\\] {
          color: var(--foreground) !important;
        }
        
        .cool-theme .text-\\[\\#8b7d8e\\] {
          color: var(--muted) !important;
        }
        
        .cool-theme .text-\\[\\#ffcb51\\] {
          color: var(--warning) !important;
        }
        
        .cool-theme .text-\\[\\#ee5760\\] {
          color: var(--danger) !important;
        }
        
        .cool-theme .text-\\[\\#eca27d\\] {
          color: var(--accent-orange) !important;
        }
        
        .cool-theme .bg-\\[\\#97d8c0\\] {
          background-color: var(--primary) !important;
        }
        
        .cool-theme .bg-\\[\\#6b6275\\]\\/50 {
          background-color: rgba(74, 144, 226, 0.15) !important;
        }
        
        .cool-theme .hover\\:bg-\\[\\#6b6275\\]\\/50:hover {
          background-color: rgba(74, 144, 226, 0.2) !important;
        }
        
        .cool-theme .bg-\\[\\#97d8c0\\]\\/20 {
          background-color: rgba(74, 144, 226, 0.2) !important;
        }
        
        .cool-theme .border-l-\\[\\#97d8c0\\] {
          border-left-color: var(--primary) !important;
        }
        
        .cool-theme .hover\\:text-\\[\\#97d8c0\\]:hover {
          color: var(--primary) !important;
        }
        
        .cool-theme .hover\\:bg-\\[\\#6b6275\\]\\/30:hover {
          background-color: rgba(74, 144, 226, 0.3) !important;
        }
      `}</style>
      
      {/* Sidebar */}
      <div className="w-full md:w-96 flex-shrink-0 bg-[#f0f4f8] border-r border-[#bdc3c7] relative">
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