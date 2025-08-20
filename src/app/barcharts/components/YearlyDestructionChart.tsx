'use client';

import React, { useState, useMemo } from 'react';

interface YearlyData {
  year: number;
  possessionTransfers: number;
  liquidations: number;
  total: number;
}

// Data from the 1933-1945 chart
const yearlyData: YearlyData[] = [
  { year: 1933, possessionTransfers: 159, liquidations: 181, total: 340 },
  { year: 1934, possessionTransfers: 114, liquidations: 210, total: 324 },
  { year: 1935, possessionTransfers: 140, liquidations: 326, total: 466 },
  { year: 1936, possessionTransfers: 285, liquidations: 528, total: 813 },
  { year: 1937, possessionTransfers: 229, liquidations: 697, total: 926 },
  { year: 1938, possessionTransfers: 568, liquidations: 1380, total: 1948 },
  { year: 1939, possessionTransfers: 212, liquidations: 2138, total: 2350 },
  { year: 1940, possessionTransfers: 27, liquidations: 927, total: 954 },
  { year: 1941, possessionTransfers: 5, liquidations: 320, total: 325 },
  { year: 1942, possessionTransfers: 81, liquidations: 38, total: 119 },
  { year: 1943, possessionTransfers: 8, liquidations: 8, total: 16 },
  { year: 1944, possessionTransfers: 6, liquidations: 6, total: 12 },
  { year: 1945, possessionTransfers: 0, liquidations: 6, total: 6 }
];

interface YearlyDestructionChartProps {
  theme?: string;
}

const YearlyDestructionChart: React.FC<YearlyDestructionChartProps> = ({ theme }) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'peak' | 'decline'>('all');

  const maxTotal = Math.max(...yearlyData.map(d => d.total));
  
  const filteredData = useMemo(() => {
    switch (selectedPeriod) {
      case 'peak':
        return yearlyData.filter(d => d.year >= 1938 && d.year <= 1939);
      case 'decline':
        return yearlyData.filter(d => d.year >= 1940);
      default:
        return yearlyData;
    }
  }, [selectedPeriod]);

  const getBarHeight = (value: number, maxValue: number) => {
    return Math.max(2, (value / maxValue) * 350);
  };

  const chartWidth = 900;
  const chartHeight = 450;
  const barWidth = 45;
  const barSpacing = 65;
  const startX = 80;

  // Historical periods
  const periods = [
    { name: 'Early Persecution', years: [1933, 1934, 1935, 1936], color: 'var(--muted)' },
    { name: 'Intensification', years: [1937, 1938, 1939], color: 'var(--warning)' },
    { name: 'War Period', years: [1940, 1941, 1942], color: 'var(--danger)' },
    { name: 'Final Phase', years: [1943, 1944, 1945], color: 'var(--foreground-muted)' }
  ];

  const getPeriodColor = (year: number) => {
    const period = periods.find(p => p.years.includes(year));
    return period?.color || 'var(--muted)';
  };

  return (
    <div className="space-y-8">
      {/* Title and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono mb-2">
            Yearly Destruction Overview (1933-1945)
          </h2>
          <p className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Complete timeline showing the systematic destruction of Jewish commercial activity
          </p>
        </div>
        
        {/* Period Filter */}
        <div className="flex border" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-3 py-2 text-xs font-mono transition-all`}
            style={{
              backgroundColor: selectedPeriod === 'all' ? 'var(--primary)' : 'transparent',
              color: selectedPeriod === 'all' ? 'var(--background)' : 'var(--foreground)',
              borderRight: '1px solid var(--border)'
            }}
          >
            All Years
          </button>
          <button
            onClick={() => setSelectedPeriod('peak')}
            className={`px-3 py-2 text-xs font-mono transition-all`}
            style={{
              backgroundColor: selectedPeriod === 'peak' ? 'var(--primary)' : 'transparent',
              color: selectedPeriod === 'peak' ? 'var(--background)' : 'var(--foreground)',
              borderRight: '1px solid var(--border)'
            }}
          >
            Peak (1938-39)
          </button>
          <button
            onClick={() => setSelectedPeriod('decline')}
            className={`px-3 py-2 text-xs font-mono transition-all`}
            style={{
              backgroundColor: selectedPeriod === 'decline' ? 'var(--primary)' : 'transparent',
              color: selectedPeriod === 'decline' ? 'var(--background)' : 'var(--foreground)'
            }}
          >
            War Years (1940+)
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="border p-6 overflow-x-auto" style={{ 
        borderColor: 'var(--border)', 
        backgroundColor: 'var(--card-bg)' 
      }}>
        <svg width={chartWidth} height={chartHeight} className="min-w-full">
          {/* Y-axis grid lines and labels */}
          {[0, 500, 1000, 1500, 2000, 2500].map((value) => (
            <g key={value}>
              <line
                x1={startX}
                y1={chartHeight - 60 - getBarHeight(value, maxTotal)}
                x2={chartWidth - 50}
                y2={chartHeight - 60 - getBarHeight(value, maxTotal)}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.3"
              />
              <text
                x={startX - 10}
                y={chartHeight - 55 - getBarHeight(value, maxTotal)}
                textAnchor="end"
                className="text-xs font-mono"
                fill="var(--foreground-muted)"
              >
                {value}
              </text>
            </g>
          ))}

          {/* Period background highlights */}
          {periods.map((period, index) => {
            const firstYear = Math.min(...period.years);
            const lastYear = Math.max(...period.years);
            const firstIndex = yearlyData.findIndex(d => d.year === firstYear);
            const lastIndex = yearlyData.findIndex(d => d.year === lastYear);
            
            if (firstIndex === -1 || lastIndex === -1) return null;
            
            return (
              <rect
                key={period.name}
                x={startX + firstIndex * barSpacing - 10}
                y={50}
                width={(lastIndex - firstIndex + 1) * barSpacing}
                height={chartHeight - 110}
                fill={period.color}
                opacity="0.05"
              />
            );
          })}

          {/* Bars */}
          {filteredData.map((data, index) => {
            const globalIndex = yearlyData.findIndex(d => d.year === data.year);
            const x = startX + globalIndex * barSpacing;
            const liquidationHeight = getBarHeight(data.liquidations, maxTotal);
            const transferHeight = getBarHeight(data.possessionTransfers, maxTotal);
            const isHovered = hoveredYear === data.year;

            return (
              <g key={data.year}>
                {/* Liquidations bar (bottom) */}
                <rect
                  x={x}
                  y={chartHeight - 60 - liquidationHeight}
                  width={barWidth}
                  height={liquidationHeight}
                  fill="var(--danger)"
                  className="cursor-pointer transition-all duration-200"
                  style={{ 
                    opacity: isHovered ? 0.8 : 0.9,
                    filter: isHovered ? 'brightness(1.1)' : 'none'
                  }}
                  onMouseEnter={() => setHoveredYear(data.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />
                
                {/* Possession transfers bar (top) */}
                <rect
                  x={x}
                  y={chartHeight - 60 - liquidationHeight - transferHeight}
                  width={barWidth}
                  height={transferHeight}
                  fill="var(--warning)"
                  className="cursor-pointer transition-all duration-200"
                  style={{ 
                    opacity: isHovered ? 0.8 : 0.9,
                    filter: isHovered ? 'brightness(1.1)' : 'none'
                  }}
                  onMouseEnter={() => setHoveredYear(data.year)}
                  onMouseLeave={() => setHoveredYear(null)}
                />

                {/* Year label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 40}
                  textAnchor="middle"
                  className="text-xs font-mono"
                  fill="var(--foreground)"
                >
                  {data.year}
                </text>

                {/* Hover tooltip */}
                {isHovered && (
                  <>
                    <rect
                      x={x - 15}
                      y={chartHeight - 60 - liquidationHeight - transferHeight - 60}
                      width={barWidth + 30}
                      height="55"
                      fill="var(--background)"
                      stroke="var(--border)"
                      strokeWidth="1"
                      rx="4"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 60 - liquidationHeight - transferHeight - 40}
                      textAnchor="middle"
                      className="text-xs font-mono font-bold"
                      fill="var(--foreground)"
                    >
                      {data.year}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 60 - liquidationHeight - transferHeight - 27}
                      textAnchor="middle"
                      className="text-xs font-mono"
                      fill="var(--foreground)"
                    >
                      Total: {data.total}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 60 - liquidationHeight - transferHeight - 14}
                      textAnchor="middle"
                      className="text-xs font-mono"
                      fill="var(--foreground-muted)"
                    >
                      L: {data.liquidations} | T: {data.possessionTransfers}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={startX}
            y1={chartHeight - 60}
            x2={chartWidth - 50}
            y2={chartHeight - 60}
            stroke="var(--border)"
            strokeWidth="2"
          />
          <line
            x1={startX}
            y1={50}
            x2={startX}
            y2={chartHeight - 60}
            stroke="var(--border)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Legend and Period Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legend */}
        <div>
          <h3 className="font-bold font-mono mb-3">Legend</h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" style={{ backgroundColor: 'var(--danger)' }}></div>
              <span>Liquidations (Business closures)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" style={{ backgroundColor: 'var(--warning)' }}></div>
              <span>Possession Transfers (Forced sales)</span>
            </div>
          </div>
        </div>

        {/* Historical Periods */}
        <div>
          <h3 className="font-bold font-mono mb-3">Historical Periods</h3>
          <div className="space-y-2 text-sm font-mono">
            {periods.map((period) => (
              <div key={period.name} className="flex items-center gap-2">
                <div className="w-4 h-4" style={{ backgroundColor: period.color, opacity: 0.3 }}></div>
                <span>{period.name} ({period.years[0]}-{period.years[period.years.length-1]})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border" style={{ 
          borderColor: 'var(--border)', 
          backgroundColor: 'var(--card-bg)' 
        }}>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--danger)' }}>
            1939
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Peak destruction year
          </div>
        </div>
        
        <div className="p-4 border" style={{ 
          borderColor: 'var(--border)', 
          backgroundColor: 'var(--card-bg)' 
        }}>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--primary)' }}>
            {yearlyData.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Total destructions
          </div>
        </div>
        
        <div className="p-4 border" style={{ 
          borderColor: 'var(--border)', 
          backgroundColor: 'var(--card-bg)' 
        }}>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--warning)' }}>
            {Math.round(yearlyData.filter(d => d.year >= 1938 && d.year <= 1939)
              .reduce((sum, d) => sum + d.total, 0) / 
              yearlyData.reduce((sum, d) => sum + d.total, 0) * 100)}%
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Destroyed in 1938-39
          </div>
        </div>
        
        <div className="p-4 border" style={{ 
          borderColor: 'var(--border)', 
          backgroundColor: 'var(--card-bg)' 
        }}>
          <div className="text-xl font-bold font-mono" style={{ color: 'var(--success)' }}>
            1943
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Destruction largely complete
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="p-6 border" style={{ 
        borderColor: 'var(--primary)', 
        backgroundColor: 'rgba(var(--primary-rgb), 0.1)' 
      }}>
        <h3 className="font-bold font-mono mb-4">Historical Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
          <div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}>1933-1937: Early Persecution</h4>
            <p>Gradual increase in business destructions as Nazi policies take effect. Economic pressure mounts on Jewish business owners.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}>1938-1939: Peak Destruction</h4>
            <p>Massive spike following Kristallnacht in November 1938. Systematic liquidation accelerates dramatically in 1939.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}>1940-1942: War Period</h4>
            <p>Continued liquidations but fewer possession transfers. Most remaining businesses systematically closed.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2" style={{ color: 'var(--foreground)' }}>1943-1945: Final Phase</h4>
            <p>Jewish commercial activity in Berlin essentially eliminated. Only isolated cases of remaining business activity.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(YearlyDestructionChart);