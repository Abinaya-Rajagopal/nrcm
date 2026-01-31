/**
 * AlertCard Component
 * 
 * Displays individual explainable alerts with specific metrics and trends.
 * Shows why an alert was triggered with transparent reasoning.
 */

import React from 'react';
import { colors, typography, spacing, type RiskLevel, riskConfig } from '../designTokens';

interface AlertCardProps {
    title: string;
    description: string;
    metric?: {
        label: string;
        value: number;
        unit: string;
        change?: number; // percentage change
        direction?: 'up' | 'down' | 'stable';
    };
    severity: RiskLevel;
    timestamp?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
    title,
    description,
    metric,
    severity,
    timestamp
}) => {
    const config = riskConfig[severity];

    const containerStyle: React.CSSProperties = {
        backgroundColor: config.bg,
        borderRadius: '12px',
        padding: spacing.lg,
        border: `1px solid ${config.light}`,
        borderLeft: `4px solid ${config.color}`,
        marginBottom: spacing.md,
        transition: 'all 0.2s ease',
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: typography.base,
        fontWeight: typography.semibold,
        color: colors.gray900,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
    };

    const descriptionStyle: React.CSSProperties = {
        fontSize: typography.sm,
        color: colors.gray600,
        lineHeight: 1.5,
        marginBottom: metric ? spacing.md : 0,
    };

    const metricContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.white,
        borderRadius: '8px',
        border: `1px solid ${colors.gray200}`,
    };

    const metricValueStyle: React.CSSProperties = {
        fontSize: typography.xl,
        fontWeight: typography.bold,
        color: colors.gray900,
    };

    const metricLabelStyle: React.CSSProperties = {
        fontSize: typography.xs,
        color: colors.gray500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    const changeStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: typography.sm,
        fontWeight: typography.semibold,
        color: metric?.direction === 'up' ? colors.riskRed :
            metric?.direction === 'down' ? colors.riskGreen : colors.gray500,
    };

    const timestampStyle: React.CSSProperties = {
        fontSize: typography.xs,
        color: colors.gray400,
        marginTop: spacing.sm,
    };

    const getDirectionIcon = (direction?: 'up' | 'down' | 'stable') => {
        switch (direction) {
            case 'up': return '↑';
            case 'down': return '↓';
            default: return '→';
        }
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div style={titleStyle}>
                    <span>{config.icon}</span>
                    <span>{title}</span>
                </div>
            </div>

            <p style={descriptionStyle}>{description}</p>

            {metric && (
                <div style={metricContainerStyle}>
                    <div>
                        <div style={metricLabelStyle}>{metric.label}</div>
                        <div style={metricValueStyle}>
                            {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
                            <span style={{ fontSize: typography.sm, color: colors.gray500, marginLeft: '4px' }}>
                                {metric.unit}
                            </span>
                        </div>
                    </div>
                    {metric.change !== undefined && (
                        <div style={changeStyle}>
                            <span>{getDirectionIcon(metric.direction)}</span>
                            <span>{Math.abs(metric.change).toFixed(1)}%</span>
                        </div>
                    )}
                </div>
            )}

            {timestamp && (
                <div style={timestampStyle}>Last updated: {timestamp}</div>
            )}
        </div>
    );
};

export default AlertCard;
