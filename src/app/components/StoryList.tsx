// file: src/app/components/StoryList.tsx

'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import TimeSlider from './TimeSlider';
import { StoryMap } from '../types';
import StoryDetail from './StoryDetail';

interface StoryListProps {
  visibleStories: StoryMap[];
  activeStoryId: string | null;
  minDate: Date;
  maxDate: Date;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onStoryClick: (storyId: string) => void;
}

const StoryList: React.FC<StoryListProps> = ({
  visibleStories,
  activeStoryId,
  minDate,
  maxDate,
  currentDate,
  setCurrentDate,
  onStoryClick
}) => {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleViewDetails = (storyId: string) => {
    setSelectedStoryId(prevId => prevId === storyId ? null : storyId);
  };

  const handleStoryClick = (storyId: string) => {
    onStoryClick(storyId);
  };

  const filteredStories = visibleStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          story.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (story: StoryMap) => {
    const now = currentDate.getTime();
    const start = new Date(story.startDate).getTime();
    const end = new Date(story.endDate).getTime();
    
    if (now < start) return 'border-l-muted opacity-60';  // Future - not yet opened
    if (now > end) return 'border-l-danger opacity-75';  // Closed
    if (story.midDate && now > new Date(story.midDate).getTime()) return 'border-l-warning';  // Declining
    return 'border-l-primary';  // Active
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 flex flex-col">
      <div className="p-6 border-b border-border bg-gray-50 dark:bg-slate-900/50">
        <h1 className="text-lg font-mono font-bold text-foreground mb-1 tracking-tight uppercase">Historical Locations</h1>
        <p className="text-xs font-mono text-muted uppercase tracking-wide">Berlin · 1900-1945</p>
        
        <div className="mt-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2.5 pl-9 bg-white dark:bg-slate-800 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted text-xs font-mono transition-all"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground text-xs font-mono transition-all"
          >
            <option value="all">All Categories</option>
            <option value="business">Businesses</option>
            <option value="institution">Institutions</option>
            <option value="residence">Residences</option>
          </select>
        </div>
        
        <div className="mt-4">
          <TimeSlider 
            minDate={minDate}
            maxDate={maxDate}
            currentDate={currentDate}
            onChange={setCurrentDate}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-xs font-mono text-muted mb-3 uppercase tracking-wide">
          {filteredStories.length} locations found
        </div>
        
        {filteredStories.map((story) => (
          <div 
            key={story.id}
            className={`group bg-white dark:bg-slate-800 p-4 border border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
              story.id === activeStoryId ? 'ring-2 ring-primary/50 shadow-md border-primary/30' : 'border-border'
            } ${getStatusColor(story)}`}
            onClick={() => handleStoryClick(story.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-mono font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                  {story.title}
                </h3>
                <p className="text-xs font-mono text-muted mt-1.5 line-clamp-2 leading-relaxed">{story.description}</p>
                
                <div className="flex items-center gap-4 mt-3 text-xs font-mono text-muted">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(story.startDate).getFullYear()} - {new Date(story.endDate).getFullYear()}
                  </span>
                  {story.category && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700/50 text-muted text-xs font-mono uppercase tracking-wide">
                      {story.category}
                    </span>
                  )}
                </div>
              </div>
              
              {story.imageUrls && story.imageUrls.length > 0 && (
                <div className="relative w-16 h-16 ml-4 overflow-hidden flex-shrink-0 border border-border">
                  <Image
                    src={story.imageUrls[0]}
                    alt={story.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            
            <button
              className="mt-3 text-xs font-mono text-primary hover:text-primary-light transition-colors uppercase tracking-wider"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(story.id);
              }}
            >
              {selectedStoryId === story.id ? '− Hide Details' : '+ View Details'}
            </button>
            
            {selectedStoryId === story.id && (
              <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                <StoryDetail story={story} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryList;