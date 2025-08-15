'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import ThemeCustomizer from './components/ThemeCustomizer';
import { useIsMounted } from '@/hooks/useIsMounted';

export default function ThemeCustomizerPage() {
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useIsMounted();
  useTheme(); // Keep hook call but don't destructure unused theme

  useEffect(() => {
    setIsOpen(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-mono font-bold mb-2" style={{ color: 'var(--primary)' }}>
              Theme Customizer
            </h1>
            <p className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
              Customize colors for all themes. Changes are saved automatically.
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={() => window.open('/', '_blank')}
              className="px-6 py-3 font-mono text-sm border hover:opacity-80 transition-all"
              style={{
                backgroundColor: 'var(--success)',
                color: 'var(--active-text)',
                borderColor: 'var(--success)'
              }}
            >
              🔍 Open Live Preview
            </button>
            <p className="text-xs font-mono mt-2" style={{ color: 'var(--foreground-muted)' }}>
              Opens the main app in a new tab. Changes you make here will be visible immediately in the preview.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="border p-6" style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border)' 
              }}>
                <h2 className="text-lg font-mono font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                  Preview Components
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-mono uppercase mb-3" style={{ color: 'var(--accent-orange)' }}>
                      Buttons
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <button className="px-4 py-2 font-mono text-sm border" style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--background)',
                        borderColor: 'var(--primary)'
                      }}>
                        Primary Button
                      </button>
                      <button className="px-4 py-2 font-mono text-sm border" style={{
                        backgroundColor: 'transparent',
                        color: 'var(--foreground)',
                        borderColor: 'var(--border)'
                      }}>
                        Secondary Button
                      </button>
                      <button className="px-4 py-2 font-mono text-sm" style={{
                        backgroundColor: 'var(--danger)',
                        color: 'var(--closed-text)'
                      }}>
                        Danger Button
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-mono uppercase mb-3" style={{ color: 'var(--accent-orange)' }}>
                      Business States
                    </h3>
                    <div className="space-y-2">
                      <div className="p-4 border-l-4" style={{
                        backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                        borderColor: 'var(--success)',
                        borderLeftColor: 'var(--success)'
                      }}>
                        <span className="font-mono text-sm" style={{ color: 'var(--active-text)' }}>
                          Active Business
                        </span>
                      </div>
                      <div className="p-4 border-l-4" style={{
                        backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                        borderColor: 'var(--warning)',
                        borderLeftColor: 'var(--warning)'
                      }}>
                        <span className="font-mono text-sm" style={{ color: 'var(--declining-text)' }}>
                          Declining Business
                        </span>
                      </div>
                      <div className="p-4 border-l-4" style={{
                        backgroundColor: 'rgba(var(--card-bg-rgb), 0.5)',
                        borderColor: 'var(--danger)',
                        borderLeftColor: 'var(--danger)'
                      }}>
                        <span className="font-mono text-sm" style={{ color: 'var(--closed-text)' }}>
                          Closed Business
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-mono uppercase mb-3" style={{ color: 'var(--accent-orange)' }}>
                      Form Elements
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Search businesses..."
                        className="w-full px-3 py-2 font-mono text-sm border focus:outline-none"
                        style={{
                          backgroundColor: 'var(--input-bg)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      />
                      <select className="w-full px-3 py-2 font-mono text-sm border focus:outline-none" style={{
                        backgroundColor: 'var(--dropdown-bg)',
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)'
                      }}>
                        <option>All Categories</option>
                        <option>Restaurant</option>
                        <option>Shop</option>
                        <option>Service</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-mono uppercase mb-3" style={{ color: 'var(--accent-orange)' }}>
                      Cards
                    </h3>
                    <div className="p-4 border shadow-sm" style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border)'
                    }}>
                      <h4 className="font-mono font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        Sample Business Card
                      </h4>
                      <p className="text-sm font-mono mb-2" style={{ color: 'var(--foreground-muted)' }}>
                        123 Sample Street, Berlin
                      </p>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 text-xs font-mono uppercase" style={{
                          backgroundColor: 'var(--muted)',
                          color: 'var(--foreground)'
                        }}>
                          Restaurant
                        </span>
                        <span className="text-xs font-mono" style={{ color: 'var(--accent-orange)' }}>
                          1920 - 1945
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="mb-4 px-4 py-2 font-mono text-sm border w-full"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--background)',
                    borderColor: 'var(--primary)'
                  }}
                >
                  {isOpen ? 'Hide' : 'Show'} Color Controls
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ThemeCustomizer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}