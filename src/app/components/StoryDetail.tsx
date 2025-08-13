// file: src/app/components/StoryDetail.tsx

import React from 'react';
import Image from 'next/image';
import { StoryMap } from '../../types';

interface StoryDetailProps {
  story: StoryMap;
}

const StoryDetail: React.FC<StoryDetailProps> = ({ story }) => {
  const [selectedImage, setSelectedImage] = React.useState(0);
  
  return (
    <div className="space-y-4">
      {story.imageUrls && story.imageUrls.length > 0 && (
        <div className="space-y-2">
          <div className="relative w-full h-48 overflow-hidden bg-gray-100 dark:bg-slate-800">
            <Image
              src={story.imageUrls[selectedImage]}
              alt={`${story.title} - Image ${selectedImage + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-opacity duration-300"
            />
          </div>
          
          {story.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {story.imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-16 h-16 flex-shrink-0 overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
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
              {story.startDate ? new Date(story.startDate).getFullYear() : 'Unknown'} - {story.endDate ? new Date(story.endDate).getFullYear() : 'Present'}
            </p>
            <p className="font-mono text-xs text-muted mt-0.5">Active Period</p>
          </div>
        </div>
      </div>
      
      {story.description && (
        <div className="pt-4 border-t border-border">
          <h5 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-3">Historical Context</h5>
          <p className="font-mono text-xs text-foreground leading-relaxed">{story.description}</p>
        </div>
      )}
      
      <div className="flex gap-3 pt-4">
        <button className="flex-1 font-mono text-xs font-semibold py-2.5 px-4 bg-white dark:bg-slate-800 text-foreground border border-border hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow uppercase tracking-wide">
          View Sources
        </button>
        <button className="flex-1 font-mono text-xs font-semibold py-2.5 px-4 bg-primary text-white border border-primary hover:bg-primary-light transition-all shadow-sm hover:shadow uppercase tracking-wide">
          Share Story
        </button>
      </div>
    </div>
  );
};

export default StoryDetail;