// file: src/app/components/StoryList.tsx

'use client';

import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import TimeSlider from './TimeSlider';
import { StoryMap } from '../../types';
import BusinessDetailModal from './BusinessDetailModal';

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
  const [selectedStory, setSelectedStory] = useState<StoryMap | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const storyRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleViewDetails = (story: StoryMap, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    setOriginRect(rect);
    setSelectedStory(story);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedStory(null);
      setOriginRect(null);
    }, 600);
  };

  const handleStoryClick = (storyId: string) => {
    onStoryClick(storyId);
    // Scroll to the story in the list
    setTimeout(() => {
      const element = storyRefs.current[storyId];
      if (element && listRef.current) {
        const listRect = listRef.current.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scrollTop = elementRect.top - listRect.top + listRef.current.scrollTop - 20;
        listRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }, 100);
  };

  // Listen for activeStoryId changes from map clicks
  useEffect(() => {
    if (activeStoryId && storyRefs.current[activeStoryId] && listRef.current) {
      const element = storyRefs.current[activeStoryId];
      const listRect = listRef.current.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const scrollTop = elementRect.top - listRect.top + listRef.current.scrollTop - 20;
      listRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }, [activeStoryId]);

  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        // Scroll ended
      }, 150);
      
      if (window.innerWidth <= 768) {
        if (listRef.current.scrollTop > 50 && !isHeaderCollapsed) {
          setIsHeaderCollapsed(true);
        }
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => {
        listElement.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [isHeaderCollapsed]);

  const filteredStories = visibleStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (story.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (story: StoryMap) => {
    const now = currentDate.getTime();
    const start = story.startDate ? new Date(story.startDate).getTime() : 0;
    const end = story.endDate ? new Date(story.endDate).getTime() : Infinity;
    
    if (now < start) return 'border-l-muted';  // Future - not yet opened
    if (now > end) return 'border-l-danger';  // Closed
    if (story.midDate && now > new Date(story.midDate).getTime()) return 'border-l-warning';  // Declining
    return 'border-l-primary';  // Active
  };

  return (
    <div className="w-full h-full bg-[#4a4a57] flex flex-col">
      <div className={`border-b border-[#6b6275] bg-[#4a4a57]/95 backdrop-blur transition-all duration-300 ${
        isHeaderCollapsed ? 'p-3 md:p-6' : 'p-4 md:p-6'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-mono font-bold text-[#97d8c0] mb-1 tracking-tight uppercase">Bygone Berlin Businesses</h1>
            {!isHeaderCollapsed && (
              <p className="text-xs font-mono text-[#ffcb51] uppercase tracking-wide">Berlin · 1900-1945</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setShowSearchFilter(!showSearchFilter)}
              className="p-2 hover:bg-[#6b6275] transition-colors"
              aria-label="Toggle search and filters"
            >
              <svg className="w-5 h-5 text-[#97d8c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            <button
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              className="p-2 hover:bg-[#6b6275] transition-colors"
              aria-label="Toggle header"
            >
              <svg 
                className={`w-5 h-5 text-[#97d8c0] transition-transform duration-200 ${isHeaderCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className={`transition-all duration-300 overflow-hidden ${
          isHeaderCollapsed && !showSearchFilter ? 'max-h-0 opacity-0 mt-0' : 'max-h-96 opacity-100 mt-4'
        } md:max-h-96 md:opacity-100 md:mt-4`}>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 pl-9 bg-[#6b6275]/50 border border-[#6b6275] focus:outline-none text-[#f5cdb4] placeholder-[#8b7d8e] text-xs font-mono transition-all"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-[#8b7d8e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#6b6275]/50 border border-[#6b6275] focus:outline-none text-[#f5cdb4] text-xs font-mono transition-all"
            >
              <option value="all">All Categories</option>
              <option value="business">Businesses</option>
              <option value="institution">Institutions</option>
              <option value="residence">Residences</option>
            </select>
          </div>
          
          <div className={`transition-all duration-300 ${isHeaderCollapsed && !showSearchFilter ? 'mt-0' : 'mt-4'}`}>
            <TimeSlider 
              minDate={minDate}
              maxDate={maxDate}
              currentDate={currentDate}
              onChange={setCurrentDate}
            />
          </div>
        </div>
      </div>
      
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-xs font-mono text-[#ffcb51] mb-3 uppercase tracking-wide font-semibold">
          {filteredStories.length} locations found
        </div>
        
        {filteredStories.map((story) => (
          <div 
            key={story.id}
            ref={(el) => { storyRefs.current[story.id] = el; }}
            className={`group bg-[#6b6275]/40 backdrop-blur border border-l-4 border-[#6b6275] transition-all duration-500 cursor-pointer shadow-sm hover:shadow-lg ${
              story.id === activeStoryId ? 'shadow-xl scale-[1.02] bg-[#97d8c0]/20 border-l-[#97d8c0]' : 'hover:bg-[#6b6275]/50'
            } ${getStatusColor(story)}`}
            style={{
              borderLeftColor: story.id === activeStoryId ? '#97d8c0' : undefined
            }}
            onClick={() => handleStoryClick(story.id)}
          >
            <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-mono font-semibold text-[#f5cdb4] text-sm group-hover:text-[#97d8c0] transition-colors">
                  {story.title}
                </h3>
                <p className="text-xs font-mono text-[#8b7d8e] mt-1.5 line-clamp-2 leading-relaxed">{story.description}</p>
                
                <div className="flex items-center gap-4 mt-3 text-xs font-mono text-muted">
                  <span className="text-[#eca27d]">
                    {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} - {story.endDate ? new Date(story.endDate).getFullYear() : 'Present'}
                  </span>
                  {story.category && (
                    <span className="px-2 py-1 bg-[#6b6275]/50 text-[#eca27d] text-xs font-mono uppercase tracking-wide">
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
              className="mt-3 text-xs font-mono text-[#f5cdb4] hover:text-[#97d8c0] transition-colors uppercase tracking-wider font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                const element = storyRefs.current[story.id];
                if (element) {
                  handleViewDetails(story, element);
                }
              }}
            >
              + View Details
            </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Business Detail Modal */}
      {selectedStory && (
        <BusinessDetailModal
          story={selectedStory}
          isOpen={modalOpen}
          onClose={closeModal}
          originRect={originRect}
        />
      )}
    </div>
  );
};

export default StoryList;