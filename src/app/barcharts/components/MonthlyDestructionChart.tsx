'use client';

import React, { useState, useMemo } from 'react';

interface MonthlyData {
  month: string;
  possessionTransfers: number;
  liquidations: number;
  total: number;
}

// Data from the 1938 and 1939 charts
const monthlyData1938: MonthlyData[] = [
  { month: 'Jan', possessionTransfers: 14, liquidations: 42, total: 56 },
  { month: 'Feb', possessionTransfers: 6, liquidations: 42, total: 48 },
  { month: 'Mar', possessionTransfers: 5, liquidations: 43, total: 48 },
  { month: 'Apr', possessionTransfers: 8, liquidations: 66, total: 74 },
  { month: 'May', possessionTransfers: 5, liquidations: 84, total: 89 },
  { month: 'Jun', possessionTransfers: 9, liquidations: 89, total: 98 },
  { month: 'Jul', possessionTransfers: 4, liquidations: 77, total: 81 },
  { month: 'Aug', possessionTransfers: 5, liquidations: 59, total: 64 },
  { month: 'Sep', possessionTransfers: 4, liquidations: 84, total: 88 },
  { month: 'Oct', possessionTransfers: 16, liquidations: 155, total: 171 },
  { month: 'Nov', possessionTransfers: 48, liquidations: 122, total: 170 },
  { month: 'Dec', possessionTransfers: 18, liquidations: 197, total: 215 }
];

const monthlyData1939: MonthlyData[] = [
  { month: 'Jan', possessionTransfers: 4, liquidations: 303, total: 307 },
  { month: 'Feb', possessionTransfers: 3, liquidations: 3, total: 6 },
  { month: 'Mar', possessionTransfers: 3, liquidations: 181, total: 184 },
  { month: 'Apr', possessionTransfers: 3, liquidations: 110, total: 113 },
  { month: 'May', possessionTransfers: 7, liquidations: 97, total: 104 },
  { month: 'Jun', possessionTransfers: 3, liquidations: 106, total: 109 },
  { month: 'Jul', possessionTransfers: 3, liquidations: 162, total: 165 },
  { month: 'Aug', possessionTransfers: 1, liquidations: 77, total: 78 },
  { month: 'Sep', possessionTransfers: 1, liquidations: 50, total: 51 },
  { month: 'Oct', possessionTransfers: 1, liquidations: 87, total: 88 },
  { month: 'Nov', possessionTransfers: 1, liquidations: 99, total: 100 },
  { month: 'Dec', possessionTransfers: 2, liquidations: 150, total: 152 }
];

interface MonthlyDestructionChartProps {
  theme?: string;
}

const MonthlyDestructionChart: React.FC<MonthlyDestructionChartProps> = ({ theme }) => {
  const [selectedYear, setSelectedYear] = useState<'1938' | '1939'>('1938');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const currentData = selectedYear === '1938' ? monthlyData1938 : monthlyData1939;
  const maxTotal = Math.max(...monthlyData1938.map(d => d.total), ...monthlyData1939.map(d => d.total));

  const getBarHeight = (value: number, maxValue: number) => {
    return Math.max(2, (value / maxValue) * 300);
  };

  const chartWidth = 800;
  const chartHeight = 400;
  const barWidth = 50;
  const barSpacing = 60;
  const startX = 80;

  return (
    <div className="space-y-8">
      {/* Title and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono mb-2">
            Monthly Destruction Timeline
          </h2>
          <p className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Possession transfers and liquidations by month showing the intensification of persecution
          </p>
        </div>
        
        {/* Year Selector */}
        <div className="flex border" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setSelectedYear('1938')}
            className={`px-4 py-2 text-sm font-mono transition-all ${
              selectedYear === '1938' ? '' : ''
            }`}
            style={{
              backgroundColor: selectedYear === '1938' ? 'var(--primary)' : 'transparent',
              color: selectedYear === '1938' ? 'var(--background)' : 'var(--foreground)',
              borderRight: '1px solid var(--border)'
            }}
          >
            1938
          </button>
          <button
            onClick={() => setSelectedYear('1939')}
            className={`px-4 py-2 text-sm font-mono transition-all ${
              selectedYear === '1939' ? '' : ''
            }`}
            style={{
              backgroundColor: selectedYear === '1939' ? 'var(--primary)' : 'transparent',
              color: selectedYear === '1939' ? 'var(--background)' : 'var(--foreground)'
            }}
          >
            1939
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="border p-6" style={{ 
        borderColor: 'var(--border)', 
        backgroundColor: 'var(--card-bg)' 
      }}>
        <svg width={chartWidth} height={chartHeight} className="w-full">
          {/* Y-axis labels */}
          {[0, 50, 100, 150, 200, 250, 300].map((value) => (
            <g key={value}>
              <line
                x1={startX - 5}
                y1={chartHeight - 50 - getBarHeight(value, maxTotal)}
                x2={chartWidth - 50}
                y2={chartHeight - 50 - getBarHeight(value, maxTotal)}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.3"
              />
              <text
                x={startX - 10}
                y={chartHeight - 45 - getBarHeight(value, maxTotal)}
                textAnchor="end"
                className="text-xs font-mono"
                fill="var(--foreground-muted)"
              >
                {value}
              </text>
            </g>
          ))}

          {/* Bars */}
          {currentData.map((data, index) => {
            const x = startX + index * barSpacing;
            const liquidationHeight = getBarHeight(data.liquidations, maxTotal);
            const transferHeight = getBarHeight(data.possessionTransfers, maxTotal);
            const isHovered = hoveredMonth === data.month;

            return (
              <g key={data.month}>
                {/* Liquidations bar (bottom) */}
                <rect
                  x={x}
                  y={chartHeight - 50 - liquidationHeight}
                  width={barWidth}
                  height={liquidationHeight}
                  fill="var(--danger)"
                  className="cursor-pointer transition-all duration-200"
                  style={{ 
                    opacity: isHovered ? 0.8 : 0.9,
                    filter: isHovered ? 'brightness(1.1)' : 'none'
                  }}
                  onMouseEnter={() => setHoveredMonth(data.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                />
                
                {/* Possession transfers bar (top) */}
                <rect
                  x={x}
                  y={chartHeight - 50 - liquidationHeight - transferHeight}
                  width={barWidth}
                  height={transferHeight}
                  fill="var(--warning)"
                  className="cursor-pointer transition-all duration-200"
                  style={{ 
                    opacity: isHovered ? 0.8 : 0.9,
                    filter: isHovered ? 'brightness(1.1)' : 'none'
                  }}
                  onMouseEnter={() => setHoveredMonth(data.month)}
                  onMouseLeave={() => setHoveredMonth(null)}
                />

                {/* Month label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 30}
                  textAnchor="middle"
                  className="text-sm font-mono"
                  fill="var(--foreground)"
                >
                  {data.month}
                </text>

                {/* Total value on hover */}
                {isHovered && (
                  <>
                    <rect
                      x={x - 5}
                      y={chartHeight - 50 - liquidationHeight - transferHeight - 40}
                      width={barWidth + 10}
                      height="35"
                      fill="var(--background)"
                      stroke="var(--border)"
                      strokeWidth="1"
                      rx="2"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 50 - liquidationHeight - transferHeight - 25}
                      textAnchor="middle"
                      className="text-xs font-mono font-bold"
                      fill="var(--foreground)"
                    >
                      Total: {data.total}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - 50 - liquidationHeight - transferHeight - 12}
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

          {/* X-axis */}
          <line
            x1={startX}
            y1={chartHeight - 50}
            x2={chartWidth - 50}
            y2={chartHeight - 50}
            stroke="var(--border)"
            strokeWidth="2"
          />

          {/* Y-axis */}
          <line
            x1={startX}
            y1={50}
            x2={startX}
            y2={chartHeight - 50}
            stroke="var(--border)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 text-sm font-mono">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'var(--danger)' }}></div>
          <span>Liquidations</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: 'var(--warning)' }}></div>
          <span>Possession Transfers</span>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border" style={{ 
          borderColor: 'var(--border)', 
          backgroundColor: 'var(--card-bg)' 
        }}>
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--danger)' }}>
            {currentData.reduce((sum, d) => sum + d.liquidations, 0)}
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Total Liquidations ({selectedYear})
          </div>
        </div>
        
        <div className="p-4 border" style={{ 
          borderColor: 'var(--border)', 
          backgroundColor: 'var(--card-bg)' 
        }}>
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--warning)' }}>
            {currentData.reduce((sum, d) => sum + d.possessionTransfers, 0)}
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Total Possession Transfers ({selectedYear})
          </div>
        </div>
        
        <div className="p-4 border" style={{ 
          borderColor: 'var(--border)', 
          backgroundColor: 'var(--card-bg)' 
        }}>
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--primary)' }}>
            {currentData.reduce((sum, d) => sum + d.total, 0)}
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--foreground-muted)' }}>
            Total Destructions ({selectedYear})
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="p-4 border" style={{ 
        borderColor: 'var(--primary)', 
        backgroundColor: 'rgba(var(--primary-rgb), 0.1)' 
      }}>
        <h3 className="font-bold font-mono mb-2">Key Insights</h3>
        <div className="text-sm font-mono space-y-1" style={{ color: 'var(--foreground-muted)' }}>
          {selectedYear === '1938' ? (
            <>
              <p>• November 1938 shows the highest spike due to Kristallnacht</p>
              <p>• October-December period marks the intensification of persecution</p>
              <p>• Possession transfers increase dramatically in the final months</p>
            </>
          ) : (
            <>
              <p>• January 1939 shows the highest liquidations (303)</p>
              <p>• Possession transfers drop significantly compared to 1938</p>
              <p>• Systematic liquidation continues throughout the year</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MonthlyDestructionChart);