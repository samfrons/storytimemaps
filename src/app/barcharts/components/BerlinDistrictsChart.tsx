'use client';

import React, { useState, useMemo } from 'react';

interface DistrictData {
  name: string;
  businesses: number;
  path?: string;
}

// District data for Berlin map
const berlinDistrictsData = [
  { name: 'Mitte', businesses: 3090 },
  { name: 'Kreuzberg', businesses: 1162 },
  { name: 'Schöneberg', businesses: 695 },
  { name: 'Charlottenburg', businesses: 590 },
  { name: 'Tiergarten', businesses: 432 },
  { name: 'Wilmersdorf', businesses: 403 },
  { name: 'Friedrichshain', businesses: 235 },
  { name: 'Prenzlauer Berg', businesses: 191 },
  { name: 'Wedding', businesses: 128 },
  { name: 'Zehlendorf', businesses: 126 },
  { name: 'Neukölln', businesses: 119 },
  { name: 'Steglitz', businesses: 82 },
  { name: 'Spandau', businesses: 62 },
  { name: 'Tempelhof', businesses: 58 },
  { name: 'Lichtenberg', businesses: 49 },
  { name: 'Weißensee', businesses: 42 },
  { name: 'Treptow', businesses: 33 },
  { name: 'Pankow', businesses: 28 },
  { name: 'Köpenick', businesses: 24 },
  { name: 'Reinickendorf', businesses: 24 }
];

interface BerlinDistrictsChartProps {
  theme?: string;
}

const BerlinDistrictsChart: React.FC<BerlinDistrictsChartProps> = ({ theme }) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const maxBusinesses = Math.max(...berlinDistrictsData.map(d => d.businesses));
  
  // Helper function to calculate approximate center of SVG path
  const getBoundingCenter = (pathString: string) => {
    const coordinates = pathString.match(/(\d+(?:\.\d+)?)/g);
    if (!coordinates) return { x: 0, y: 0 };
    
    const nums = coordinates.map(Number);
    const xCoords = nums.filter((_, i) => i % 2 === 0);
    const yCoords = nums.filter((_, i) => i % 2 === 1);
    
    return {
      x: xCoords.reduce((sum, x) => sum + x, 0) / xCoords.length,
      y: yCoords.reduce((sum, y) => sum + y, 0) / yCoords.length
    };
  };
  
  const getBarHeight = (businesses: number) => {
    return Math.max(5, (businesses / maxBusinesses) * 120);
  };

  const getBarColor = (businesses: number, isHovered: boolean, isSelected: boolean) => {
    if (isSelected) return 'var(--primary)';
    if (isHovered) return 'var(--primary-light)';
    
    // Color based on number of businesses
    if (businesses > 1000) return 'var(--danger)';
    if (businesses > 500) return 'var(--warning)';
    if (businesses > 100) return 'var(--success)';
    return 'var(--muted)';
  };

  const sortedData = useMemo(() => {
    return [...berlinDistrictsData].sort((a, b) => b.businesses - a.businesses);
  }, []);

  return (
    <div className="space-y-8">
      {/* Title and Description */}
      <div>
        <h2 className="text-xl font-bold font-mono mb-2">
          Distribution of Jewish Businesses by Berlin District
        </h2>
        <p className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
          Interactive visualization showing business concentration across Berlin's districts.
          Hover over bars for details.
        </p>
      </div>

      {/* Map Visualization */}
      <div className="border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
        <svg viewBox="0 0 1000 900" className="w-full h-[600px]">
          {/* Berlin map outline with realistic district boundaries */}
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="var(--shadow)" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Main Berlin boundary */}
          <path
            d="M 150,350 Q 200,250 350,280 L 450,250 Q 550,200 650,250 L 750,300 Q 850,350 800,450 L 850,550 Q 900,650 800,700 L 700,750 Q 600,800 500,780 L 400,800 Q 300,750 250,650 L 200,550 Q 150,450 150,350 Z"
            fill="rgba(var(--muted-rgb), 0.1)"
            stroke="var(--border)"
            strokeWidth="2"
          />
          
          {/* Spree River */}
          <path
            d="M 300,400 Q 400,450 500,430 Q 600,410 700,450 Q 750,470 800,500"
            fill="none"
            stroke="rgba(var(--primary-rgb), 0.3)"
            strokeWidth="3"
          />
          
          {/* District areas with more realistic shapes */}
          {[
            // Mitte - central, irregular shape
            { name: 'Mitte', path: 'M 450,380 L 520,360 L 580,400 L 560,460 L 500,480 L 440,450 Z', businesses: 3090 },
            
            // Kreuzberg - south of Mitte
            { name: 'Kreuzberg', path: 'M 480,480 L 560,460 L 580,520 L 520,560 L 460,540 Z', businesses: 1162 },
            
            // Schöneberg - southwest
            { name: 'Schöneberg', path: 'M 300,580 L 400,560 L 460,620 L 380,680 L 280,660 Z', businesses: 695 },
            
            // Charlottenburg - west
            { name: 'Charlottenburg', path: 'M 220,400 L 340,380 L 380,460 L 320,520 L 200,500 Z', businesses: 590 },
            
            // Tiergarten - central west
            { name: 'Tiergarten', path: 'M 340,380 L 450,380 L 440,450 L 380,460 Z', businesses: 432 },
            
            // Wilmersdorf - southwest
            { name: 'Wilmersdorf', path: 'M 200,520 L 320,520 L 300,580 L 180,600 Z', businesses: 403 },
            
            // Friedrichshain - east of Mitte
            { name: 'Friedrichshain', path: 'M 580,400 L 660,390 L 680,450 L 620,480 L 560,460 Z', businesses: 235 },
            
            // Prenzlauer Berg - northeast
            { name: 'Prenzlauer Berg', path: 'M 520,320 L 600,300 L 620,380 L 560,400 L 520,360 Z', businesses: 191 },
            
            // Wedding - north
            { name: 'Wedding', path: 'M 350,280 L 450,250 L 520,320 L 450,380 L 350,360 Z', businesses: 128 },
            
            // Zehlendorf - far southwest
            { name: 'Zehlendorf', path: 'M 150,650 L 250,630 L 280,700 L 180,720 Z', businesses: 126 },
            
            // Neukölln - southeast
            { name: 'Neukölln', path: 'M 520,560 L 620,540 L 640,600 L 560,620 Z', businesses: 119 },
            
            // Steglitz - south
            { name: 'Steglitz', path: 'M 280,660 L 380,680 L 400,740 L 300,760 Z', businesses: 82 },
            
            // Tempelhof - south central
            { name: 'Tempelhof', path: 'M 400,620 L 520,600 L 540,660 L 450,680 Z', businesses: 58 },
            
            // Spandau - far west
            { name: 'Spandau', path: 'M 80,420 L 180,400 L 200,480 L 120,500 Z', businesses: 62 },
            
            // Lichtenberg - far east
            { name: 'Lichtenberg', path: 'M 720,480 L 820,460 L 840,540 L 740,560 Z', businesses: 49 },
            
            // Treptow - southeast
            { name: 'Treptow', path: 'M 640,600 L 740,580 L 760,640 L 660,660 Z', businesses: 33 },
            
            // Pankow - far north
            { name: 'Pankow', path: 'M 450,180 L 580,160 L 600,240 L 520,260 Z', businesses: 28 },
            
            // Weißensee - northeast
            { name: 'Weißensee', path: 'M 600,280 L 700,260 L 720,340 L 620,360 Z', businesses: 42 },
            
            // Köpenick - far southeast
            { name: 'Köpenick', path: 'M 760,640 L 860,620 L 880,700 L 780,720 Z', businesses: 24 },
            
            // Reinickendorf - northwest
            { name: 'Reinickendorf', path: 'M 200,200 L 320,180 L 350,260 L 250,280 Z', businesses: 24 }
          ].map((district) => {
            const isHovered = hoveredDistrict === district.name;
            const isSelected = selectedDistrict === district.name;
            const barHeight = getBarHeight(district.businesses);
            
            // Calculate centroid for bar placement
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('d', district.path);
            
            return (
              <g key={district.name}>
                {/* District area */}
                <path
                  d={district.path}
                  fill={isSelected ? 'rgba(var(--primary-rgb), 0.2)' : isHovered ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(var(--muted-rgb), 0.05)'}
                  stroke="var(--border)"
                  strokeWidth={isSelected ? "2" : "1"}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredDistrict(district.name)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  onClick={() => setSelectedDistrict(isSelected ? null : district.name)}
                />
                
                {/* Business count bar - positioned at approximate center of each district */}
                <rect
                  x={getBoundingCenter(district.path).x - 8}
                  y={getBoundingCenter(district.path).y - barHeight/2}
                  width="16"
                  height={barHeight}
                  fill={getBarColor(district.businesses, isHovered, isSelected)}
                  stroke="var(--card-bg)"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  style={{ 
                    filter: isHovered ? 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }}
                  onMouseEnter={() => setHoveredDistrict(district.name)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  onClick={() => setSelectedDistrict(isSelected ? null : district.name)}
                />
                
                {/* District label */}
                <text
                  x={getBoundingCenter(district.path).x}
                  y={getBoundingCenter(district.path).y + barHeight/2 + 20}
                  textAnchor="middle"
                  className="text-xs font-mono"
                  fill="var(--foreground)"
                  style={{ fontSize: '9px', pointerEvents: 'none' }}
                >
                  {district.name}
                </text>
                
                {/* Business count label */}
                <text
                  x={getBoundingCenter(district.path).x}
                  y={getBoundingCenter(district.path).y + barHeight/2 + 32}
                  textAnchor="middle"
                  className="text-xs font-mono font-bold"
                  fill="var(--primary)"
                  style={{ fontSize: '9px', pointerEvents: 'none' }}
                >
                  {district.businesses}
                </text>
                
                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={getBoundingCenter(district.path).x - 40}
                      y={getBoundingCenter(district.path).y - barHeight/2 - 45}
                      width="80"
                      height="30"
                      fill="var(--background)"
                      stroke="var(--border)"
                      strokeWidth="1"
                      rx="4"
                      filter="url(#shadow)"
                    />
                    <text
                      x={getBoundingCenter(district.path).x}
                      y={getBoundingCenter(district.path).y - barHeight/2 - 30}
                      textAnchor="middle"
                      className="text-xs font-mono font-bold"
                      fill="var(--foreground)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {district.name}
                    </text>
                    <text
                      x={getBoundingCenter(district.path).x}
                      y={getBoundingCenter(district.path).y - barHeight/2 - 18}
                      textAnchor="middle"
                      className="text-xs font-mono"
                      fill="var(--foreground-muted)"
                      style={{ pointerEvents: 'none' }}
                    >
                      {district.businesses} businesses
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Map legend */}
          <text x="50" y="50" className="text-sm font-mono font-bold" fill="var(--foreground)">
            Berlin Districts (1933-1945)
          </text>
          <text x="50" y="70" className="text-xs font-mono" fill="var(--foreground-muted)">
            Bar height shows business count
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'var(--danger)' }}></div>
          <span>1000+ businesses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'var(--warning)' }}></div>
          <span>500-999 businesses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'var(--success)' }}></div>
          <span>100-499 businesses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'var(--muted)' }}></div>
          <span>Under 100 businesses</span>
        </div>
      </div>

      {/* Rankings List */}
      <div>
        <h3 className="text-lg font-bold font-mono mb-4">Districts by Business Count</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {sortedData.map((district, index) => (
            <div
              key={district.name}
              className={`p-3 border cursor-pointer transition-all ${
                selectedDistrict === district.name ? 'border-2' : ''
              }`}
              style={{
                borderColor: selectedDistrict === district.name ? 'var(--primary)' : 'var(--border)',
                backgroundColor: selectedDistrict === district.name ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'
              }}
              onClick={() => setSelectedDistrict(selectedDistrict === district.name ? null : district.name)}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">{index + 1}. {district.name}</span>
                <span className="font-mono font-bold" style={{ color: 'var(--primary)' }}>
                  {district.businesses}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected District Info */}
      {selectedDistrict && (
        <div className="p-4 border" style={{ 
          borderColor: 'var(--primary)', 
          backgroundColor: 'rgba(var(--primary-rgb), 0.1)' 
        }}>
          <h4 className="font-bold font-mono mb-2">{selectedDistrict}</h4>
          <p className="text-sm font-mono">
            {berlinDistrictsData.find(d => d.name === selectedDistrict)?.businesses} Jewish businesses
          </p>
          <p className="text-xs font-mono mt-1" style={{ color: 'var(--foreground-muted)' }}>
            {Math.round((berlinDistrictsData.find(d => d.name === selectedDistrict)?.businesses || 0) / 
            berlinDistrictsData.reduce((sum, d) => sum + d.businesses, 0) * 100)}% of total businesses
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(BerlinDistrictsChart);