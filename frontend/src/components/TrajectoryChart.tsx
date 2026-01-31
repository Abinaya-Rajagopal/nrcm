/**
 * TrajectoryChart Component - Dual Layer Support
 * 
 * Displays healing trajectory with strict Layer A/B separation:
 * 
 * LAYER A (Always Visible):
 * - Base reference curve (solid green)
 * - Actual measured curve (solid blue)
 * 
 * LAYER B (Simulation Mode Only):
 * - Context-adjusted reference curve (dashed)
 * - Optional shaded extrapolation window
 * - Mandatory caption about dashed curves
 */

import React from 'react';
import {
  colors,
  typography,
  spacing,
  labels,
  type SimulationData
} from '../designTokens';

interface TrajectoryData {
  expected: number[];
  actual: number[];
}

interface TrajectoryChartProps {
  data: TrajectoryData;
  simulationMode?: boolean;
  simulationData?: SimulationData;
  width?: number;
  height?: number;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  data,
  simulationMode = false,
  simulationData,
  width = 600,
  height = 320,
}) => {
  const padding = { top: 30, right: 30, bottom: 50, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const allValues = [
    ...data.expected,
    ...data.actual,
    ...(simulationMode && simulationData ? simulationData.adjustedTrajectory : []),
  ];
  const maxValue = Math.max(...allValues) * 1.15;
  const minValue = 0;

  const xScale = (index: number, totalPoints: number) =>
    padding.left + (index / (totalPoints - 1)) * chartWidth;

  const yScale = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  // Generate path strings
  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    const points = values.map((v, i) => `${xScale(i, values.length)},${yScale(v)}`);
    return `M ${points.join(' L ')}`;
  };

  // Create area path for gradient fill
  const createAreaPath = (values: number[]) => {
    if (values.length === 0) return '';
    const linePath = createPath(values);
    return `${linePath} L ${xScale(values.length - 1, values.length)},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;
  };

  const expectedPath = createPath(data.expected);
  const actualPath = createPath(data.actual);
  const actualAreaPath = createAreaPath(data.actual);
  const simulatedPath = simulationMode && simulationData
    ? createPath(simulationData.adjustedTrajectory)
    : '';

  // Styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: spacing['2xl'],
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: `2px solid ${colors.gray200}`,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.gray900,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const subTitleStyle: React.CSSProperties = {
    fontSize: typography.sm,
    color: colors.gray500,
  };

  const captionStyle: React.CSSProperties = {
    marginTop: spacing.lg,
    padding: spacing.md,
    background: colors.gray50,
    borderRadius: '8px',
    border: `1px dashed ${colors.gray300}`,
    fontSize: typography.xs,
    color: colors.gray600,
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>
            <span>📈</span>
            <span>Recovery Trajectory</span>
          </div>
          <div style={subTitleStyle}>
            Healing progress over {data.actual.length} days
          </div>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Layer A - Actual gradient */}
          <linearGradient id="actualGradientLayerA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.blue500} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colors.blue500} stopOpacity="0" />
          </linearGradient>

          {/* Layer B - Simulation zone */}
          {simulationMode && (
            <pattern id="simulationPattern" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2"
                stroke={colors.riskAmber}
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          )}
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke={colors.gray200}
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill={colors.gray400}
                fontFamily={typography.fontFamily}
              >
                {(maxValue - (ratio * (maxValue - minValue))).toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.expected.map((_, i) => (
          <text
            key={`x-${i}`}
            x={xScale(i, data.expected.length)}
            y={height - 15}
            textAnchor="middle"
            fontSize={11}
            fill={colors.gray400}
            fontFamily={typography.fontFamily}
          >
            Day {i + 1}
          </text>
        ))}

        {/* LAYER A: Expected trajectory (solid green) */}
        <path
          d={expectedPath}
          fill="none"
          stroke={colors.riskGreen}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* LAYER A: Actual Area Fill */}
        <path
          d={actualAreaPath}
          fill="url(#actualGradientLayerA)"
        />

        {/* LAYER A: Actual trajectory (solid blue) */}
        <path
          d={actualPath}
          fill="none"
          stroke={colors.blue500}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* LAYER B: Simulated trajectory (dashed amber) - Only in simulation mode */}
        {simulationMode && simulatedPath && (
          <path
            d={simulatedPath}
            fill="none"
            stroke={colors.riskAmber}
            strokeWidth={2}
            strokeDasharray="8 4"
            strokeLinecap="round"
            opacity={0.8}
          />
        )}

        {/* Data points - Layer A Actual */}
        {data.actual.map((v, i) => (
          <g key={`act-${i}`}>
            <circle
              cx={xScale(i, data.actual.length)}
              cy={yScale(v)}
              r={i === data.actual.length - 1 ? 7 : 4}
              fill={colors.white}
              stroke={colors.blue500}
              strokeWidth={2}
            />
            {i === data.actual.length - 1 && (
              <circle
                cx={xScale(i, data.actual.length)}
                cy={yScale(v)}
                r={12}
                fill={colors.blue500}
                fillOpacity="0.15"
              />
            )}
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${padding.left + 10}, ${padding.top - 10})`}>
          {/* Layer A legends */}
          <line x1={0} y1={0} x2={20} y2={0} stroke={colors.riskGreen} strokeWidth={2.5} />
          <text x={25} y={4} fontSize={11} fill={colors.gray600} fontFamily={typography.fontFamily}>
            Reference Path
          </text>

          <circle cx={100} cy={0} r={4} fill={colors.blue500} />
          <text x={108} y={4} fontSize={11} fill={colors.gray600} fontFamily={typography.fontFamily}>
            Measured Progress
          </text>

          {/* Layer B legend - only in simulation mode */}
          {simulationMode && (
            <>
              <line x1={220} y1={0} x2={240} y2={0} stroke={colors.riskAmber} strokeWidth={2} strokeDasharray="6 3" />
              <text x={245} y={4} fontSize={11} fill={colors.gray600} fontFamily={typography.fontFamily}>
                Simulated Trajectory
              </text>
            </>
          )}
        </g>
      </svg>

      {/* Mandatory caption for simulation mode */}
      {simulationMode && (
        <div style={captionStyle}>
          <span>ℹ️</span>
          <span>{labels.dashCurveCaption}</span>
        </div>
      )}
    </div>
  );
};

export default TrajectoryChart;
