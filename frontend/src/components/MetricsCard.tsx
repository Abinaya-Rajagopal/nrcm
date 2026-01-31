/**
 * MetricsCard Component
 * 
 * Displays a single wound metric with label, value, and unit.
 */

import React from 'react';
import { RISK_COLORS, RiskLevel } from '../config';

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
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    minWidth: '150px',
    textAlign: 'center',
    border: riskLevel ? `2px solid ${RISK_COLORS[riskLevel]}` : '1px solid #e5e7eb',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
    fontWeight: 500,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: riskLevel ? RISK_COLORS[riskLevel] : '#111827',
  };

  const unitStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#9ca3af',
    marginLeft: '4px',
  };

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span style={unitStyle}>{unit}</span>}
      </div>
    </div>
  );
};

export default MetricsCard;
