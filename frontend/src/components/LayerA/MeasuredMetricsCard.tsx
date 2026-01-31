/**
 * MeasuredMetricsCard - Layer A Component
 * 
 * Displays MEASURED wound metrics derived ONLY from the uploaded image.
 * This is Ground Truth data - never shows simulation values.
 * 
 * Styling: Solid borders, full opacity (Layer A visual rules)
 */

import React from 'react';
import { colors, typography, spacing, riskConfig, type RiskLevel } from '../../designTokens';

interface MeasuredMetricsCardProps {
    label: string;
    value: number | string;
    unit?: string;
    riskLevel?: RiskLevel;
    delta?: {
        value: number;
        direction: 'up' | 'down';
    };
}

export const MeasuredMetricsCard: React.FC<MeasuredMetricsCardProps> = ({
    label,
    value,
    unit = '',
    riskLevel,
    delta,
}) => {
    const risk = riskLevel ? riskConfig[riskLevel] : null;
    const accentColor = risk ? risk.color : colors.blue500;

    const cardStyle: React.CSSProperties = {
        background: colors.white,
        border: `2px solid ${colors.gray200}`,
        borderRadius: '16px',
        padding: spacing['2xl'],
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '160px',
    };

    const accentBarStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: accentColor,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: typography.sm,
        fontWeight: typography.semibold,
        color: colors.gray500,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: spacing.sm,
    };

    const valueContainerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'baseline',
        gap: spacing.xs,
    };

    const valueStyle: React.CSSProperties = {
        fontSize: '32px',
        fontWeight: typography.extrabold,
        color: colors.gray900,
        lineHeight: 1.2,
    };

    const unitStyle: React.CSSProperties = {
        fontSize: typography.base,
        fontWeight: typography.medium,
        color: colors.gray400,
    };

    const deltaStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        marginTop: spacing.md,
        padding: `${spacing.xs} ${spacing.sm}`,
        borderRadius: '999px',
        fontSize: typography.xs,
        fontWeight: typography.semibold,
        background: delta?.direction === 'down' ? colors.riskGreenBg : colors.riskAmberBg,
        color: delta?.direction === 'down' ? '#166534' : '#92400E',
    };

    const badgeStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.md,
        padding: `${spacing.xs} ${spacing.md}`,
        borderRadius: '999px',
        fontSize: typography.xs,
        fontWeight: typography.semibold,
        background: risk ? `${risk.color}15` : colors.gray100,
        color: risk ? risk.color : colors.gray600,
    };

    const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;

    return (
        <div style={cardStyle}>
            <div style={accentBarStyle} />

            <div style={labelStyle}>{label}</div>

            <div style={valueContainerStyle}>
                <span style={valueStyle}>{formattedValue}</span>
                {unit && <span style={unitStyle}>{unit}</span>}
            </div>

            {delta && (
                <div style={deltaStyle}>
                    <span>{delta.direction === 'down' ? '↓' : '↑'}</span>
                    <span>{Math.abs(delta.value).toFixed(1)}%</span>
                </div>
            )}

            {riskLevel && !delta && (
                <div style={badgeStyle}>
                    <span>{risk?.icon}</span>
                    <span>{risk?.label}</span>
                </div>
            )}
        </div>
    );
};

export default MeasuredMetricsCard;
