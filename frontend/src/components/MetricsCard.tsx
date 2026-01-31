/**
 * MetricsCard Component
 * 
 * Displays a single wound metric with label, value, and unit.
 */

import React from 'react';
import type { RiskLevel } from '../config';

interface MetricsCardProps {
  label: string;
  value: number | string;
  unit?: string;
  riskLevel?: RiskLevel;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  label,
  value,
  unit = '',
  riskLevel
}) => {
  const getRiskColor = (level?: RiskLevel) => {
    switch (level) {
      case 'RED': return '#EF4444';
      case 'AMBER': return '#F59E0B';
      case 'GREEN': return '#22C55E';
      default: return '#3B82F6'; // Default blue
    }
  };

  const accentColor = riskLevel ? getRiskColor(riskLevel) : '#E5E7EB';

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    minWidth: '150px',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  const accentBarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    backgroundColor: accentColor,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '8px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 800,
    color: '#111827',
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  };

  const unitStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#9CA3AF',
    fontWeight: 500,
  };

  const statusBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    marginTop: '12px',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: `${accentColor}15`,
    color: accentColor,
    alignSelf: 'flex-start',
  };

  return (
    <div style={cardStyle}>
      <div style={accentBarStyle} />
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span style={unitStyle}>{unit}</span>}
      </div>
      {riskLevel && (
        <span style={statusBadgeStyle}>
          {riskLevel} RISK
        </span>
      )}
    </div>
  );
};

export default MetricsCard;
