'use client';

import { useState, useEffect } from 'react';
import { StoryMap } from '../types';

export const useStoryMapLogic = () => {
  const [storyMaps, setStoryMaps] = useState<StoryMap[]>([]);
  const [visibleStories, setVisibleStories] = useState<StoryMap[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date('1930-01-01'));
  const [minDate, setMinDate] = useState<Date>(new Date('1930-01-01'));
  const [maxDate, setMaxDate] = useState<Date>(new Date('1945-12-31'));

  useEffect(() => {
    const fetchStoryMaps = async () => {
      try {
        const response = await fetch('/api/storymaps');
        if (!response.ok) {
          throw new Error('Failed to fetch story maps');
        }
        const data = await response.json();
        setStoryMaps(data);
        
        const dates = data.flatMap((story: StoryMap) => [
          story.startDate ? new Date(story.startDate) : new Date(),
          story.endDate ? new Date(story.endDate) : new Date()
        ].filter(date => !isNaN(date.getTime())));
        setMinDate(new Date(Math.min(...dates)));
        setMaxDate(new Date(Math.max(...dates)));
      } catch (error) {
        console.error('Error fetching story maps:', error);
      }
    };

    fetchStoryMaps();
  }, []);

  useEffect(() => {
    // Show ALL stories, don't filter them out
    // The visual state will change based on the current date
    setVisibleStories(storyMaps);
  }, [storyMaps, currentDate]);

  const handleMarkerClick = (storyId: string) => {
    setActiveStoryId(storyId);
  };

  const testMarkers = visibleStories.map(story => {
    const now = currentDate.getTime();
    const start = story.startDate ? new Date(story.startDate).getTime() : 0;
    const end = story.endDate ? new Date(story.endDate).getTime() : Infinity;
    
    let state = 'active';
    if (now < start) {
      state = 'future';  // Not yet opened
    } else if (now > end) {
      state = 'closed';  // Already closed
    } else if (story.midDate && now > new Date(story.midDate).getTime()) {
      state = 'declining';  // In decline phase
    }
    // else state remains 'active' - currently operating
    
    return {
      id: story.id,
      position: [story.lat, story.lng] as [number, number],
      popup: story.title,
      state
    };
  });

  return {
    storyMaps,
    visibleStories,
    activeStoryId,
    currentDate,
    minDate,
    maxDate,
    setCurrentDate,
    handleMarkerClick,
    testMarkers,
    setActiveStoryId,
  };
};

export const berlinCoordinates: [number, number] = [52.52, 13.405];
export const defaultZoom = 12;