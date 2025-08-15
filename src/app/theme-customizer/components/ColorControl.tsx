'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { hexToRgb, rgbToHex } from '../utils/colorUtils';

interface ColorControlProps {
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

const ColorControl: React.FC<ColorControlProps> = ({ name, value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);
  const [showCopied, setShowCopied] = useState(false);
  const isRgbVariable = name.includes('-rgb');

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    
    if (isRgbVariable) {
      onChange(name, newValue);
    } else {
      onChange(name, newValue);
      
      const rgbName = `${name}-rgb`;
      if (name === '--primary' || name === '--background' || name === '--muted' || 
          name === '--input-bg' || name === '--card-bg') {
        const rgb = hexToRgb(newValue);
        if (rgb) {
          onChange(rgbName, rgb);
        }
      }
    }
  }, [name, isRgbVariable, onChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(localValue);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [localValue]);

  const getColorValue = () => {
    if (isRgbVariable) {
      const rgb = localValue.split(',').map(v => v.trim());
      if (rgb.length === 3) {
        return rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
      }
    }
    return localValue;
  };

  const displayName = name.replace('--', '').replace(/-/g, ' ');

  return (
    <div className="flex items-center gap-2 group">
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-mono capitalize mb-1" style={{ 
          color: 'var(--foreground-muted)' 
        }}>
          {displayName}
        </label>
        <div className="flex gap-2">
          {!isRgbVariable && (
            <input
              type="color"
              value={getColorValue()}
              onChange={(e) => handleChange(e.target.value)}
              className="w-10 h-8 border cursor-pointer"
              style={{ borderColor: 'var(--border)' }}
            />
          )}
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            className="flex-1 px-2 py-1 font-mono text-xs border focus:outline-none"
            style={{
              backgroundColor: 'var(--input-bg)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          />
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs font-mono border hover:opacity-80 relative"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            {showCopied ? '✓' : '📋'}
            {showCopied && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs whitespace-nowrap" style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--success)'
              }}>
                Copied!
              </span>
            )}
          </button>
        </div>
      </div>
      {!isRgbVariable && (
        <div 
          className="w-6 h-6 border"
          style={{ 
            backgroundColor: localValue,
            borderColor: 'var(--border)'
          }}
        />
      )}
    </div>
  );
};

export default React.memo(ColorControl);