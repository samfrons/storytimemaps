'use client';

import Link from 'next/link';

export default function ThemePreviewIndex() {
  const themes = [
    {
      name: 'Cool',
      path: '/theme-preview/cool',
      description: 'Light and clean with blues and teals',
      colors: ['#4a90e2', '#6ba3e7', '#f0f4f8', '#2c3e50'],
      status: 'ready'
    },
    {
      name: 'Moody',
      path: '/theme-preview/moody',
      description: 'Dark and atmospheric (current theme)',
      colors: ['#97d8c0', '#4a4a57', '#f5cdb4', '#6b6275'],
      status: 'ready'
    },
    {
      name: 'Bauhaus',
      path: '/theme-preview/bauhaus',
      description: 'Bold geometric with primary colors',
      colors: ['#ff0000', '#0066ff', '#ffcc00', '#000000'],
      status: 'ready'
    },
    {
      name: 'Warm',
      path: '/theme-preview/warm',
      description: 'Oranges, yellows, and warm browns',
      colors: ['#ff6b35', '#f7931e', '#fbb03b', '#8b4513'],
      status: 'pending'
    },
    {
      name: 'Hot',
      path: '/theme-preview/hot',
      description: 'Reds, oranges, and bright yellows',
      colors: ['#ff0000', '#ff4500', '#ffa500', '#ffff00'],
      status: 'pending'
    },
    {
      name: 'Cold',
      path: '/theme-preview/cold',
      description: 'Icy blues, whites, and grays',
      colors: ['#e0f2f1', '#b2dfdb', '#4dd0e1', '#0097a7'],
      status: 'pending'
    },
    {
      name: 'Art Nouveau',
      path: '/theme-preview/art-nouveau',
      description: 'Muted greens, browns, and golds',
      colors: ['#8b7355', '#556b2f', '#daa520', '#704214'],
      status: 'pending'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Theme Preview</h1>
        <p className="text-gray-600 mb-8">Select a theme to preview the StoryMap with different color schemes and map styles</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div key={theme.name} className="relative">
              {theme.status === 'ready' ? (
                <Link href={theme.path}>
                  <div className="bg-white p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-bold">{theme.name}</h2>
                      {theme.name === 'Moody' && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1">Current</span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm">{theme.description}</p>
                    
                    <div className="flex gap-2 mb-4">
                      {theme.colors.map((color, index) => (
                        <div
                          key={index}
                          className="w-12 h-12 border-2 border-gray-200"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    
                    <div className="text-blue-600 font-semibold text-sm">
                      View Theme →
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-gray-200 p-6 opacity-50">
                  <h2 className="text-2xl font-bold mb-2">{theme.name}</h2>
                  <p className="text-gray-600 mb-4 text-sm">{theme.description}</p>
                  
                  <div className="flex gap-2 mb-4">
                    {theme.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 border-2 border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  
                  <div className="text-gray-500 font-semibold text-sm">
                    Coming Soon
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-yellow-50 border-2 border-yellow-200">
          <h3 className="text-lg font-bold mb-2">🎨 Theme Implementation Notes</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Each theme maintains the same interface and functionality</li>
            <li>• Themes include custom map styles matching the color scheme</li>
            <li>• CSS variables are used for easy theme switching</li>
            <li>• Marker colors and states adapt to each theme</li>
          </ul>
        </div>
      </div>
    </div>
  );
}