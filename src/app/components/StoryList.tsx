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
    
    if (now < start) return 'border-muted';
    if (now > end) return 'border-danger';
    if (story.midDate && now > new Date(story.midDate).getTime()) return 'border-warning';
    return 'border-primary';
  };

  return (
    <div className="w-full h-full bg-slate-900/95 backdrop-blur flex flex-col">
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Bygone Business</h1>
        <p className="text-sm text-slate-400">Jewish Businesses in Pre-1945 Berlin</p>
        
        <div className="mt-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-slate-800/80 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-slate-200 placeholder-slate-500 text-sm"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800/80 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-slate-200 text-sm"
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
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-900/0 to-slate-900/50">
        <div className="text-sm text-slate-400 mb-2">
          {filteredStories.length} locations found
        </div>
        
        {filteredStories.map((story) => (
          <div 
            key={story.id}
            className={`group bg-slate-800/60 backdrop-blur rounded-lg p-4 border-l-4 transition-all duration-300 hover:shadow-xl hover:bg-slate-800/80 cursor-pointer ${
              story.id === activeStoryId ? 'ring-2 ring-primary shadow-xl' : ''
            } ${getStatusColor(story)}`}
            onClick={() => handleStoryClick(story.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-100 group-hover:text-primary-light transition-colors">
                  {story.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{story.description}</p>
                
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(story.startDate).getFullYear()} - {new Date(story.endDate).getFullYear()}
                  </span>
                  {story.category && (
                    <span className="px-2 py-0.5 bg-slate-700/70 text-slate-300 rounded-full">
                      {story.category}
                    </span>
                  )}
                </div>
              </div>
              
              {story.imageUrls && story.imageUrls.length > 0 && (
                <div className="relative w-20 h-20 ml-4 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={story.imageUrls[0]}
                    alt={story.title}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
              )}
            </div>
            
            <button
              className="mt-3 text-xs text-primary-light hover:text-slate-300 transition-colors"
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