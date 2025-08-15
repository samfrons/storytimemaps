'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import ColorGroup from './ColorGroup';
import ExportPanel from './ExportPanel';
import { getThemeVariables, updateCSSVariable, resetThemeToDefaults } from '../utils/themeStorage';
import { debounce } from '@/utils/performance';
import { useIsMounted } from '@/hooks/useIsMounted';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const { theme, themes, setTheme } = useTheme();
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'colors' | 'export'>('colors');
  const [isModified, setIsModified] = useState(false);
  const mounted = useIsMounted();

  useEffect(() => {
    if (theme) {
      const variables = getThemeVariables(theme);
      setCustomVariables(variables);
      const savedCustom = localStorage.getItem(`theme-custom-${theme}`);
      setIsModified(!!savedCustom);
    }
  }, [theme]);

  const debouncedUpdate = useMemo(
    () => debounce((name: string, value: string, themeKey: string) => {
      updateCSSVariable(name, value);
      
      const custom = JSON.parse(localStorage.getItem(`theme-custom-${themeKey}`) || '{}');
      custom[name] = value;
      localStorage.setItem(`theme-custom-${themeKey}`, JSON.stringify(custom));
      setIsModified(true);
    }, 100),
    []
  );

  const handleColorChange = useCallback((name: string, value: string) => {
    setCustomVariables(prev => ({ ...prev, [name]: value }));
    if (theme) {
      debouncedUpdate(name, value, theme);
    }
  }, [theme, debouncedUpdate]);

  const handleReset = useCallback(() => {
    if (!theme || !confirm(`Reset ${theme} theme to defaults? This will remove all customizations.`)) return;
    
    resetThemeToDefaults(theme);
    const variables = getThemeVariables(theme);
    setCustomVariables(variables);
    setIsModified(false);
    
    Object.entries(variables).forEach(([name, value]) => {
      updateCSSVariable(name, value);
    });
  }, [theme]);

  const colorGroups = useMemo(() => ({
    'Core Colors': [
      '--primary',
      '--primary-rgb',
      '--primary-light',
      '--secondary',
      '--background',
      '--background-rgb',
      '--foreground',
      '--foreground-muted'
    ],
    'State Colors': [
      '--success',
      '--warning',
      '--danger',
      '--muted',
      '--muted-rgb'
    ],
    'Accent Colors': [
      '--accent-orange',
      '--accent-yellow',
      '--accent-green',
      '--accent-blue',
      '--accent-purple'
    ],
    'UI Components': [
      '--border',
      '--shadow',
      '--input-bg',
      '--input-bg-rgb',
      '--dropdown-bg',
      '--card-bg',
      '--card-bg-rgb',
      '--placeholder-color',
      '--map-overlay'
    ],
    'Text State Colors': [
      '--active-text',
      '--active-text-secondary',
      '--declining-text',
      '--declining-text-secondary',
      '--closed-text',
      '--closed-text-secondary'
    ]
  }), []);

  if (!theme) return null;

  return (
    <div className={`fixed right-0 top-0 h-full w-[400px] shadow-2xl transform transition-transform duration-300 z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ backgroundColor: 'var(--background)' }}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-mono font-bold" style={{ color: 'var(--primary)' }}>
              Customize Theme
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--foreground)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono uppercase mb-1" style={{ color: 'var(--foreground-muted)' }}>
                Current Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm border focus:outline-none"
                style={{
                  backgroundColor: 'var(--dropdown-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                {themes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {isModified && (
              <div className="flex items-center justify-between p-2 border" style={{
                backgroundColor: 'rgba(var(--warning-rgb, 255, 203, 81), 0.1)',
                borderColor: 'var(--warning)'
              }}>
                <span className="text-xs font-mono" style={{ color: 'var(--warning)' }}>
                  Theme has custom colors
                </span>
                <button
                  onClick={handleReset}
                  className="px-2 py-1 text-xs font-mono border hover:opacity-80"
                  style={{
                    borderColor: 'var(--warning)',
                    color: 'var(--warning)'
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('colors')}
              className={`flex-1 px-3 py-2 font-mono text-xs uppercase border ${
                activeTab === 'colors' ? 'border-b-2' : ''
              }`}
              style={{
                backgroundColor: activeTab === 'colors' ? 'var(--muted)' : 'transparent',
                borderColor: activeTab === 'colors' ? 'var(--primary)' : 'var(--border)',
                color: activeTab === 'colors' ? 'var(--primary)' : 'var(--foreground)'
              }}
            >
              Colors
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 px-3 py-2 font-mono text-xs uppercase border ${
                activeTab === 'export' ? 'border-b-2' : ''
              }`}
              style={{
                backgroundColor: activeTab === 'export' ? 'var(--muted)' : 'transparent',
                borderColor: activeTab === 'export' ? 'var(--primary)' : 'var(--border)',
                color: activeTab === 'export' ? 'var(--primary)' : 'var(--foreground)'
              }}
            >
              Export
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'colors' ? (
            <div className="p-4 space-y-6">
              {Object.entries(colorGroups).map(([groupName, variables]) => (
                <ColorGroup
                  key={groupName}
                  name={groupName}
                  variables={variables}
                  values={customVariables}
                  onChange={handleColorChange}
                />
              ))}
            </div>
          ) : (
            <ExportPanel
              theme={theme}
              variables={customVariables}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ThemeCustomizer);