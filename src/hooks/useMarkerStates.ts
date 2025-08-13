// hooks/useMarkerStates.ts
import { useMemo } from 'react';
import { StoryMap } from '../types';

export const useMarkerStates = (stories: StoryMap[], currentDate: Date) => {
  return useMemo(() => {
    return stories.map(story => {
      const startDate = story.startDate ? new Date(story.startDate) : null;
      const midDate = story.midDate ? new Date(story.midDate) : null;
      const endDate = story.endDate ? new Date(story.endDate) : null;

      let state = 'active';
      if (endDate && currentDate >= endDate) {
        state = 'closed';
      } else if (midDate && currentDate >= midDate) {
        state = 'overtaken';
      } else if (startDate && currentDate < startDate) {
        state = 'future';
      }

      return { id: story.id, state };
    });
  }, [stories, currentDate]);
};