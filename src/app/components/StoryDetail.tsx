// file: src/app/components/StoryDetail.tsx

import React from 'react';
import Image from 'next/image';
import { StoryMap } from '../../types';

interface StoryDetailProps {
  story: StoryMap;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ story }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = React.useState(0);
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  
  // Combine legacy imageUrls with new media array
  const allMedia = React.useMemo(() => {
    const mediaItems = [];
    
    // Add new media array items first (higher priority)
    if (story.media && story.media.length > 0) {
      mediaItems.push(...story.media);
    }
    
    // Add legacy imageUrls as image media items
    if (story.imageUrls && story.imageUrls.length > 0) {
      story.imageUrls.forEach((url, index) => {
        mediaItems.push({
          url,
          type: 'image' as const,
          caption: `Image ${index + 1}`
        });
      });
    }
    
    return mediaItems;
  }, [story.media, story.imageUrls]);
  
  const currentMedia = allMedia[selectedMediaIndex];
  
  return (
    <div className="space-y-4">
      {allMedia.length > 0 && (
        <div className="space-y-2">
          <div 
            className="relative w-full min-h-[12rem] max-h-[24rem]"
            style={{ backgroundColor: 'var(--background)' }}
          >
            {currentMedia?.type === 'video' ? (
              <video
                src={currentMedia.url}
                controls
                className="w-full h-auto max-h-[24rem] object-contain"
                poster={currentMedia.url.replace(/\.(mp4|webm)$/, '.jpg')}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={currentMedia?.url || ''}
                alt={currentMedia?.caption || `${story.title} - Media ${selectedMediaIndex + 1}`}
                width={800}
                height={400}
                className="w-full h-auto max-h-[24rem] object-contain"
              />
            )}
            
            {currentMedia?.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                <p className="text-xs font-mono">{currentMedia.caption}</p>
              </div>
            )}
          </div>
          
          {allMedia.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allMedia.map((mediaItem, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMediaIndex(index)}
                  className="relative w-16 h-16 flex-shrink-0 overflow-hidden border-2 transition-all"
                  style={{
                    borderColor: selectedMediaIndex === index ? 'var(--primary)' : 'transparent',
                    opacity: selectedMediaIndex === index ? 1 : 0.7,
                    boxShadow: selectedMediaIndex === index ? '0 0 0 2px rgba(var(--primary-rgb), 0.5)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedMediaIndex !== index) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMediaIndex !== index) {
                      e.currentTarget.style.opacity = '0.7';
                    }
                  }}
                >
                  {mediaItem.type === 'video' ? (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--muted)' }}
                    >
                      <svg 
                        className="w-6 h-6" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  ) : (
                    <Image
                      src={mediaItem.url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-start gap-3">
          <svg 
            className="w-4 h-4 mt-0.5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: 'var(--muted)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="flex-1">
            <p 
              className="font-mono text-xs font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {story.address}
            </p>
            <p 
              className="font-mono text-xs mt-0.5"
              style={{ color: 'var(--muted)' }}
            >
              {story.lat.toFixed(6)}, {story.lng.toFixed(6)}
            </p>
          </div>
        </div>
        
        {story.category && (
          <div className="flex items-start gap-3">
            <svg 
              className="w-4 h-4 mt-0.5 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'var(--muted)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <div className="flex-1">
              <p 
                className="font-mono text-xs font-semibold uppercase"
                style={{ color: 'var(--foreground)' }}
              >
                {story.category}
              </p>
              <p 
                className="font-mono text-xs mt-0.5"
                style={{ color: 'var(--muted)' }}
              >
                Category
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <svg 
            className="w-4 h-4 mt-0.5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: 'var(--muted)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p 
              className="font-mono text-xs font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} - {story.endDate === 'Unknown' ? 'Unknown' : (story.endDate ? new Date(story.endDate).getFullYear() : 'Unknown')}
            </p>
            <p 
              className="font-mono text-xs mt-0.5"
              style={{ color: 'var(--muted)' }}
            >
              Active Period
            </p>
          </div>
        </div>
      </div>
      
      {(story.description || story.longDescription) && (
        <div 
          className="pt-4 border-t"
          style={{ borderTopColor: 'var(--border)' }}
        >
          <h5 
            className="font-mono text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Historical Context
          </h5>
          
          {story.description && (
            <p 
              className="font-mono text-xs leading-relaxed mb-3"
              style={{ color: 'var(--foreground)' }}
            >
              {story.description}
            </p>
          )}
          
          {story.longDescription && (
            <div className="space-y-3">
              <div 
                className={`font-mono text-xs leading-relaxed ${!showFullDescription ? 'line-clamp-4' : ''}`}
                style={{ color: 'var(--foreground)' }}
              >
                {story.longDescription}
              </div>
              
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs font-mono font-semibold transition-colors cursor-pointer"
                style={{ color: 'var(--primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent-yellow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                {showFullDescription ? 'Read less' : 'Read more'} →
              </button>
            </div>
          )}
        </div>
      )}
      
      {story.businessType && (
        <div 
          className="pt-4 border-t"
          style={{ borderTopColor: 'var(--border)' }}
        >
          <h5 
            className="font-mono text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Business Type
          </h5>
          <p 
            className="font-mono text-xs capitalize"
            style={{ color: 'var(--foreground)' }}
          >
            {story.businessType}
          </p>
        </div>
      )}
      
      <div className="flex gap-3 pt-4">
        <button 
          className="flex-1 font-mono text-xs font-semibold py-2.5 px-4 border transition-all shadow-sm hover:shadow uppercase tracking-wide"
          style={{
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--background)';
          }}
        >
          View Sources
        </button>
        <button 
          className="flex-1 font-mono text-xs font-semibold py-2.5 px-4 border transition-all shadow-sm hover:shadow uppercase tracking-wide"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--background)',
            borderColor: 'var(--primary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-yellow)';
            e.currentTarget.style.borderColor = 'var(--accent-yellow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
        >
          Share Story
        </button>
      </div>
    </div>
  );
};

export default StoryDetail;