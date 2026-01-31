/**
 * TrajectoryChart Component
 * 
 * Displays healing trajectory comparison (expected vs actual).
 * Simple SVG-based line chart - no external dependencies.
 */

import React from 'react';
import type { TrajectoryData } from '../api/analyze';

interface TrajectoryChartProps {
  data: TrajectoryData;
  width?: number;
  height?: number;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  data,
  width = 600,
  height = 300
}) => {
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const allValues = [...data.expected, ...data.actual];
  const maxValue = Math.max(...allValues) * 1.1; // Add headroom
  const minValue = 0; // Fix to 0 for area charts usually, or Math.min(...allValues) * 0.9

  const xScale = (index: number) =>
    padding.left + (index / (data.expected.length - 1)) * chartWidth;

  const yScale = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  // Generate path strings
  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    const points = values.map((v, i) => `${xScale(i)},${yScale(v)}`);
    return `M ${points.join(' L ')}`;
  };

  // Create area path (for gradient fill)
  const createAreaPath = (values: number[]) => {
    if (values.length === 0) return '';
    const linePath = createPath(values);
    return `${linePath} L ${xScale(values.length - 1)},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;
  };

  const expectedPath = createPath(data.expected);
  const actualPath = createPath(data.actual);
  const actualAreaPath = createAreaPath(data.actual);

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    fontFamily: 'sans-serif',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '4px',
  };

  const subTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '20px',
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Recovery Trajectory</div>
      <div style={subTitleStyle}>Healing progress over the last {data.actual.length} days</div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines (Y-axis) */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize={12}
                fill="#9CA3AF"
              >
                {(maxValue - (ratio * (maxValue - minValue))).toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* X-axis custom labels (Days) */}
        {data.expected.map((_, i) => (
          <text
            key={`x-${i}`}
            x={xScale(i)}
            y={height - 10}
            textAnchor="middle"
            fontSize={12}
            fill="#9CA3AF"
          >
            Day {i + 1}
          </text>
        ))}

        {/* Expected trajectory (green dashed) */}
        <path
          d={expectedPath}
          fill="none"
          stroke="#10B981"
          strokeWidth={2}
          strokeDasharray="6 6"
        />

        {/* Actual Area Fill */}
        <path
          d={actualAreaPath}
          fill="url(#actualGradient)"
        />

        {/* Actual trajectory (orange solid) */}
        <path
          d={actualPath}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points - Actual (only last one emphasized) */}
        {data.actual.map((v, i) => (
          <g key={`act-${i}`}>
            <circle
              cx={xScale(i)}
              cy={yScale(v)}
              r={i === data.actual.length - 1 ? 6 : 4}
              fill="#fff"
              stroke="#F59E0B"
              strokeWidth={2}
            />
            {i === data.actual.length - 1 && (
              <circle
                cx={xScale(i)}
                cy={yScale(v)}
                r={10}
                fill="#F59E0B"
                fillOpacity="0.2"
              />
            )}
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${padding.left}, 0)`}>
          <circle cx={0} cy={0} r={4} fill="#10B981" />
          <text x={10} y={4} fontSize={12} fill="#374151">Expected Path</text>

          <circle cx={100} cy={0} r={4} fill="#F59E0B" />
          <text x={110} y={4} fontSize={12} fill="#374151">Actual Healing</text>
        </g>
      </svg>
    </div>
  );
};

export default TrajectoryChart;
