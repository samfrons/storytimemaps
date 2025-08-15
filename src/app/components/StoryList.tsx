// file: src/app/components/StoryList.tsx

'use client';

import Image from 'next/image';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import TimeSlider from './TimeSlider';
import { StoryMap } from '../../types';
import BusinessDetailModal from './BusinessDetailModal';
import { throttle } from '../../utils/performance';

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
  const { theme } = useTheme();
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const storyRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [showSearchFilter, setShowSearchFilter] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleDropdownToggle = () => {
    if (!isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Update dropdown position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isDropdownOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDropdownOpen]);

  const handleModalNavigation = (direction: 'prev' | 'next') => {
    if (!selectedStory) return;
    
    const currentIndex = filteredStories.findIndex(s => s.id === selectedStory.id);
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < filteredStories.length) {
      const targetStory = filteredStories[targetIndex];
      setSelectedStory(targetStory);
    }
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
    const handleScroll = throttle(() => {
      if (!listRef.current) return;
      
      if (window.innerWidth <= 768) {
        if (listRef.current.scrollTop > 50 && !isHeaderCollapsed) {
          setIsHeaderCollapsed(true);
        }
      }
    }, 100);

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        listElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isHeaderCollapsed]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unique business types from stories for dynamic categories
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    visibleStories.forEach(story => {
      if (story.businessType) {
        categories.add(story.businessType);
      } else if (story.category) {
        categories.add(story.category);
      }
    });
    return Array.from(categories).sort();
  }, [visibleStories]);

  const filteredStories = visibleStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (story.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const storyCategory = story.businessType || story.category || '';
    const matchesCategory = selectedCategory === 'all' || storyCategory === selectedCategory;
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

  const getStoryState = (story: StoryMap) => {
    const now = currentDate.getTime();
    const start = story.startDate ? new Date(story.startDate).getTime() : 0;
    const end = story.endDate ? new Date(story.endDate).getTime() : Infinity;
    
    if (now < start) return 'future';
    if (now > end) return 'closed';
    if (story.midDate && now > new Date(story.midDate).getTime()) return 'declining';
    return 'active';
  };

  const getActiveStoryStyle = (story: StoryMap, isActive: boolean) => {
    if (!isActive) return {};
    
    const state = getStoryState(story);
    switch (state) {
      case 'declining':
        return {
          backgroundColor: 'var(--warning)',
          borderLeftColor: 'var(--warning)',
          color: 'var(--foreground)'
        };
      case 'closed':
        return {
          backgroundColor: 'var(--danger)',
          borderLeftColor: 'var(--danger)',
          color: theme === 'hot' ? 'var(--secondary)' : 'var(--secondary)'
        };
      case 'active':
      default:
        // Use theme-specific colors
        if (theme === 'moody' || !theme) {
          return {
            backgroundColor: 'var(--success)',
            borderLeftColor: 'var(--success)',
            color: '#2a2a2a' // Black text for moody theme active state
          };
        } else if (theme === 'bauhaus') {
          return {
            backgroundColor: 'var(--primary)',
            borderLeftColor: 'var(--primary)',
            color: 'var(--secondary)'
          };
        } else {
          return {
            backgroundColor: 'rgba(var(--primary-rgb), 0.85)',
            borderLeftColor: 'var(--primary)',
            color: theme === 'cool' || theme === 'cold' || theme === 'hot' ? 'var(--secondary)' : 'var(--foreground)'
          };
        }
    }
  };

  return (
    <div className="w-full h-full flex flex-col" style={{backgroundColor: 'var(--background)'}}>
      <div className={`border-b backdrop-blur transition-all duration-300 z-[1] relative ${
        isHeaderCollapsed ? 'p-3 md:p-6' : 'p-4 md:p-6'
      }`} style={{borderBottomColor: 'var(--border)', backgroundColor: 'rgba(var(--background-rgb), 0.95)'}}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-mono font-bold mb-1 tracking-tight uppercase" style={{color: 'var(--primary)'}}>Bygone Berlin Businesses</h1>
            {!isHeaderCollapsed && (
              <p className="text-xs font-mono uppercase tracking-wide" style={{color: 'var(--accent-orange)'}}>Berlin · 1900-1945</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setShowSearchFilter(!showSearchFilter)}
                className="p-2 transition-colors hover:bg-[var(--border)]"
                aria-label="Toggle search and filters"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--primary)'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              <button
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="p-2 transition-colors hover:bg-[var(--border)]"
                aria-label="Toggle header"
              >
                <svg 
                  className={`w-5 h-5 transition-transform duration-200 ${isHeaderCollapsed ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{color: 'var(--primary)'}}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className={`transition-all duration-300 overflow-hidden z-[1] relative ${
          isHeaderCollapsed && !showSearchFilter ? 'max-h-0 opacity-0 mt-0' : 'max-h-96 opacity-100 mt-4'
        } md:max-h-96 md:opacity-100 md:mt-4`}>
          <div className="space-y-3">
            <div className="flex gap-2 md:block">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2.5 pl-9 focus:outline-none text-xs font-mono transition-all border"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--muted)'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div ref={dropdownRef} className="relative z-[100000]">
              <button
                onClick={handleDropdownToggle}
                className="w-full px-3 py-2.5 border focus:outline-none text-xs font-mono transition-all text-left flex items-center justify-between cursor-pointer hover:opacity-80"
                style={{
                  backgroundColor: 'var(--input-bg, rgba(107, 98, 117, 0.5))',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <span>{selectedCategory === 'all' ? 'All Categories' : selectedCategory}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{color: 'var(--muted)'}}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="md:fixed absolute top-full left-0 right-0 border backdrop-blur-sm z-[99999] max-h-[600px] overflow-y-auto shadow-lg mt-1 hot-dropdown" 
                     style={{
                       backgroundColor: 'var(--dropdown-bg)',
                       borderColor: 'var(--border)',
                       top: window.innerWidth >= 768 ? `${dropdownPosition.top}px` : undefined,
                       left: window.innerWidth >= 768 ? `${dropdownPosition.left}px` : undefined,
                       width: window.innerWidth >= 768 ? `${dropdownPosition.width}px` : undefined
                     }}>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 text-left text-xs font-mono transition-colors ${
                      selectedCategory === 'all' ? 'border-l-2 dropdown-active' : ''
                    }`}
                    style={{
                      backgroundColor: selectedCategory === 'all' ? 'var(--border)' : 'transparent',
                      color: selectedCategory === 'all' ? 'var(--primary)' : 'var(--foreground)',
                      borderLeftColor: selectedCategory === 'all' ? 'var(--primary)' : 'transparent'
                    }}
                  >
                    All Categories
                  </button>
                  {availableCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 text-left text-xs font-mono transition-colors ${
                        selectedCategory === category ? 'border-l-2 dropdown-active' : ''
                      }`}
                      style={{
                        backgroundColor: selectedCategory === category ? 'var(--border)' : 'transparent',
                        color: selectedCategory === category ? 'var(--primary)' : 'var(--foreground)',
                        borderLeftColor: selectedCategory === category ? 'var(--primary)' : 'transparent'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
        <div className="text-xs font-mono mb-3 uppercase tracking-wide font-semibold" style={{color: 'var(--accent-orange)'}}>
          {filteredStories.length} locations found
        </div>
        
        {filteredStories.map((story) => (
          <div 
            key={story.id}
            ref={(el) => { storyRefs.current[story.id] = el; }}
            data-story-id={story.id}
            className={`group backdrop-blur border border-l-4 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-lg ${
              story.id === activeStoryId ? 'shadow-xl scale-[1.02]' : ''
            } ${getStatusColor(story)}`}
            style={{
              backgroundColor: story.id === activeStoryId ? undefined : 'var(--card-bg)',
              borderTopColor: 'var(--border)',
              borderRightColor: 'var(--border)',
              borderBottomColor: 'var(--border)',
              borderLeftColor: 'var(--border)',
              opacity: 1,
              ...getActiveStoryStyle(story, story.id === activeStoryId)
            }}
            onClick={() => handleStoryClick(story.id)}
          >
            <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-mono font-semibold text-sm transition-colors ${
                  story.id === activeStoryId ? 
                    '' :
                    ''
                }`}
                style={{
                  color: story.id === activeStoryId ? undefined : 'var(--foreground)'
                }}>
                  {story.title}
                </h3>
                {story.address && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono mt-1 ${
                    story.id === activeStoryId ? 
                      '' :
                      ''
                  }`}
                  style={{
                    color: story.id === activeStoryId ? undefined : 'var(--foreground-muted)'
                  }}>
                    <svg 
                      className="w-3 h-3 flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                    <span>{story.address}</span>
                  </div>
                )}
                <p className={`text-xs font-mono mt-1.5 line-clamp-2 leading-relaxed ${
                  story.id === activeStoryId ? 
                    '' :
                    ''
                }`}
                style={{
                  color: story.id === activeStoryId ? undefined : 'var(--foreground-muted)'
                }}>{story.description}</p>
                
                <div className="flex items-center gap-4 mt-3 text-xs font-mono">
                  <span className={`${
                    story.id === activeStoryId ? 
                      '' :
                      ''
                  }`}
                  style={{
                    color: story.id === activeStoryId ? undefined : 'var(--foreground)'
                  }}>
                    {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} - {story.endDate === 'Unknown' ? 'Unknown' : (story.endDate ? new Date(story.endDate).getFullYear() : 'Unknown')}
                  </span>
                  {(story.businessType || story.category) && (
                    <span className={`px-2 py-1 text-xs font-mono uppercase tracking-wide ${
                      story.id === activeStoryId ? 
                        'bg-black/20 text-current' :
                        ''
                    }`}
                    style={{
                      backgroundColor: story.id === activeStoryId ? undefined : 'var(--card-bg)',
                      color: story.id === activeStoryId ? undefined : 'var(--foreground)',
                      opacity: 1
                    }}>
                      {story.businessType || story.category}
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
              className={`view-details-button mt-3 px-3 py-1.5 text-xs font-mono bg-transparent border transition-all uppercase tracking-wider font-semibold inline-block ${
                story.id === activeStoryId 
                  ? 'hover:opacity-80'
                  : ''
              }`}
              style={{
                color: story.id === activeStoryId 
                  ? (getActiveStoryStyle(story, true).color === 'var(--secondary)' ? 'var(--secondary)' : 'var(--foreground)')
                  : 'var(--foreground)',
                borderColor: story.id === activeStoryId 
                  ? (getActiveStoryStyle(story, true).color === 'var(--secondary)' ? 'var(--border)' : 'var(--muted)')
                  : 'var(--muted)',
                backgroundColor: story.id === activeStoryId ? 'transparent' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (story.id !== activeStoryId) {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                  e.currentTarget.style.color = 'var(--background)';
                }
              }}
              onMouseLeave={(e) => {
                if (story.id !== activeStoryId) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--foreground)';
                }
              }}
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
          onNavigate={handleModalNavigation}
          hasPrevious={filteredStories.findIndex(s => s.id === selectedStory.id) > 0}
          hasNext={filteredStories.findIndex(s => s.id === selectedStory.id) < filteredStories.length - 1}
        />
      )}
    </div>
  );
};

export default React.memo(StoryList, (prevProps, nextProps) => {
  return (
    prevProps.activeStoryId === nextProps.activeStoryId &&
    prevProps.currentDate.getTime() === nextProps.currentDate.getTime() &&
    prevProps.minDate.getTime() === nextProps.minDate.getTime() &&
    prevProps.maxDate.getTime() === nextProps.maxDate.getTime() &&
    JSON.stringify(prevProps.visibleStories) === JSON.stringify(nextProps.visibleStories)
  );
});