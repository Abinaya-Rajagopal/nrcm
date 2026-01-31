/**
 * TrajectoryChart Component
 * 
 * Displays healing trajectory comparison (expected vs actual).
 * Simple SVG-based line chart - no external dependencies.
 */

import React from 'react';
import { TrajectoryData } from '../api/analyze';

interface TrajectoryChartProps {
  data: TrajectoryData;
  width?: number;
  height?: number;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ 
  data, 
  width = 400, 
  height = 200 
}) => {
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate scales
  const allValues = [...data.expected, ...data.actual];
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues) * 0.9;
  const valueRange = maxValue - minValue;

  const xScale = (index: number) => 
    padding + (index / (data.expected.length - 1)) * chartWidth;
  
  const yScale = (value: number) => 
    padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Generate path strings
  const createPath = (values: number[]) => 
    values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`).join(' ');

  const expectedPath = createPath(data.expected);
  const actualPath = createPath(data.actual);

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '12px',
  };

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    marginTop: '12px',
    fontSize: '12px',
  };

  const legendItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Healing Trajectory</div>
      <svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + chartHeight * ratio}
            x2={padding + chartWidth}
            y2={padding + chartHeight * ratio}
            stroke="#e5e7eb"
            strokeDasharray="4"
          />
        ))}

        {/* Expected trajectory (green dashed) */}
        <path
          d={expectedPath}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2}
          strokeDasharray="6 4"
        />

        {/* Actual trajectory (orange solid) */}
        <path
          d={actualPath}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
        />

        {/* Data points - Expected */}
        {data.expected.map((v, i) => (
          <circle
            key={`exp-${i}`}
            cx={xScale(i)}
            cy={yScale(v)}
            r={4}
            fill="#22c55e"
          />
        ))}

        {/* Data points - Actual */}
        {data.actual.map((v, i) => (
          <circle
            key={`act-${i}`}
            cx={xScale(i)}
            cy={yScale(v)}
            r={4}
            fill="#f59e0b"
          />
        ))}

        {/* Y-axis labels */}
        <text x={padding - 8} y={padding} textAnchor="end" fontSize={10} fill="#6b7280">
          {maxValue.toFixed(1)}
        </text>
        <text x={padding - 8} y={padding + chartHeight} textAnchor="end" fontSize={10} fill="#6b7280">
          {minValue.toFixed(1)}
        </text>

        {/* X-axis label */}
        <text x={padding + chartWidth / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#6b7280">
          Days
        </text>

        {/* Y-axis label */}
        <text x={12} y={height / 2} textAnchor="middle" fontSize={10} fill="#6b7280" transform={`rotate(-90 12 ${height/2})`}>
          Area (cm²)
        </text>
      </svg>
      <div style={legendStyle}>
        <div style={legendItemStyle}>
          <div style={{ width: 16, height: 3, backgroundColor: '#22c55e' }} />
          <span>Expected</span>
        </div>
        <div style={legendItemStyle}>
          <div style={{ width: 16, height: 3, backgroundColor: '#f59e0b' }} />
          <span>Actual</span>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryChart;
