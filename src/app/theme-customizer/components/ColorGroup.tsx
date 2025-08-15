'use client';

import React, { useState } from 'react';
import ColorControl from './ColorControl';

interface ColorGroupProps {
  name: string;
  variables: string[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

const ColorGroup: React.FC<ColorGroupProps> = ({ name, variables, values, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border" style={{ borderColor: 'var(--border)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:opacity-80 transition-opacity"
        style={{ backgroundColor: 'var(--muted)' }}
      >
        <span className="font-mono text-sm font-semibold uppercase" style={{ color: 'var(--primary)' }}>
          {name}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: 'var(--foreground)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="p-3 space-y-3" style={{ backgroundColor: 'rgba(var(--card-bg-rgb), 0.3)' }}>
          {variables.map(variable => (
            <ColorControl
              key={variable}
              name={variable}
              value={values[variable] || ''}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ColorGroup);