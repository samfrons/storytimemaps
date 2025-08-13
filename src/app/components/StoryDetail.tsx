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
          <div className="relative w-full h-48 overflow-hidden bg-[#4a4a57]">
            {currentMedia?.type === 'video' ? (
              <video
                src={currentMedia.url}
                controls
                className="w-full h-full object-cover"
                poster={currentMedia.url.replace(/\.(mp4|webm)$/, '.jpg')}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={currentMedia?.url || ''}
                alt={currentMedia?.caption || `${story.title} - Media ${selectedMediaIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-opacity duration-300"
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
                  className={`relative w-16 h-16 flex-shrink-0 overflow-hidden border-2 transition-all ${
                    selectedMediaIndex === index 
                      ? 'border-[#97d8c0] ring-2 ring-[#97d8c0] ring-opacity-50' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  {mediaItem.type === 'video' ? (
                    <div className="w-full h-full bg-[#6b6275] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#f5cdb4]" fill="currentColor" viewBox="0 0 24 24">
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
          <svg className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-mono text-xs font-semibold text-foreground">{story.address}</p>
            <p className="font-mono text-xs text-muted mt-0.5">
              {story.lat.toFixed(6)}, {story.lng.toFixed(6)}
            </p>
          </div>
        </div>
        
        {story.category && (
          <div className="flex items-start gap-3">
            <svg className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <div className="flex-1">
              <p className="font-mono text-xs font-semibold text-foreground uppercase">{story.category}</p>
              <p className="font-mono text-xs text-muted mt-0.5">Category</p>
            </div>
          </div>
        )}
        
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-mono text-xs font-semibold text-foreground">
              {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} - {story.endDate === 'Unknown' ? 'Unknown' : (story.endDate ? new Date(story.endDate).getFullYear() : 'Unknown')}
            </p>
            <p className="font-mono text-xs text-muted mt-0.5">Active Period</p>
          </div>
        </div>
      </div>
      
      {(story.description || story.longDescription) && (
        <div className="pt-4 border-t border-[#6b6275]">
          <h5 className="font-mono text-xs font-bold text-[#8b7d8e] uppercase tracking-wider mb-3">Historical Context</h5>
          
          {story.description && (
            <p className="font-mono text-xs text-[#f5cdb4] leading-relaxed mb-3">
              {story.description}
            </p>
          )}
          
          {story.longDescription && (
            <div className="space-y-3">
              <div className={`font-mono text-xs text-[#f5cdb4] leading-relaxed ${!showFullDescription ? 'line-clamp-4' : ''}`}>
                {story.longDescription}
              </div>
              
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs font-mono font-semibold text-[#97d8c0] hover:text-[#ffcb51] transition-colors cursor-pointer"
              >
                {showFullDescription ? 'Read less' : 'Read more'} →
              </button>
            </div>
          )}
        </div>
      )}
      
      {story.businessType && (
        <div className="pt-4 border-t border-[#6b6275]">
          <h5 className="font-mono text-xs font-bold text-[#8b7d8e] uppercase tracking-wider mb-2">Business Type</h5>
          <p className="font-mono text-xs text-[#f5cdb4] capitalize">{story.businessType}</p>
        </div>
      )}
      
      <div className="flex gap-3 pt-4">
        <button className="flex-1 font-mono text-xs font-semibold py-2.5 px-4 bg-[#4a4a57] text-[#f5cdb4] border border-[#6b6275] hover:bg-[#6b6275] transition-all shadow-sm hover:shadow uppercase tracking-wide">
          View Sources
        </button>
        <button className="flex-1 font-mono text-xs font-semibold py-2.5 px-4 bg-[#97d8c0] text-[#2a2a2a] border border-[#97d8c0] hover:bg-[#ffcb51] hover:border-[#ffcb51] transition-all shadow-sm hover:shadow uppercase tracking-wide">
          Share Story
        </button>
      </div>
    </div>
  );
};

export default StoryDetail;