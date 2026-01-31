/**
 * SimulatedMetricsCard - Layer B Component
 * 
 * Displays HYPOTHETICAL simulated values.
 * MUST always show "Simulated" tag and dashed border styling.
 * 
 * This component NEVER appears by default - only after explicit user action.
 */

import React from 'react';
import { colors, typography, spacing, labels, layerStyles } from '../../designTokens';

interface SimulatedMetricsCardProps {
    label: string;
    value: number | string;
    unit?: string;
    originalValue?: number; // Layer A measured value for comparison
}

export const SimulatedMetricsCard: React.FC<SimulatedMetricsCardProps> = ({
    label,
    value,
    unit = '',
    originalValue,
}) => {
    const cardStyle: React.CSSProperties = {
        ...layerStyles.layerB,
        padding: spacing['2xl'],
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '160px',
    };

    const simulatedTagStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.md}`,
        background: colors.gray100,
        border: `1px dashed ${colors.gray400}`,
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: typography.semibold,
        color: colors.gray600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: spacing.md,
        alignSelf: 'flex-start',
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
        fontSize: '28px',
        fontWeight: typography.bold,
        color: colors.gray700,
        lineHeight: 1.2,
    };

    const unitStyle: React.CSSProperties = {
        fontSize: typography.sm,
        fontWeight: typography.medium,
        color: colors.gray400,
    };

    const comparisonStyle: React.CSSProperties = {
        marginTop: spacing.md,
        fontSize: typography.xs,
        color: colors.gray500,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
    };

    const disclaimerStyle: React.CSSProperties = {
        marginTop: spacing.md,
        fontSize: '11px',
        color: colors.gray500,
        fontStyle: 'italic',
        lineHeight: 1.4,
    };

    const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;
    const formattedOriginal = originalValue?.toFixed(1);

    return (
        <div style={cardStyle}>
            <div style={simulatedTagStyle}>
                <span>◇</span>
                <span>Simulated</span>
            </div>

            <div style={labelStyle}>{label}</div>

            <div style={valueContainerStyle}>
                <span style={valueStyle}>{formattedValue}</span>
                {unit && <span style={unitStyle}>{unit}</span>}
            </div>

            {originalValue !== undefined && (
                <div style={comparisonStyle}>
                    <span>Measured:</span>
                    <span style={{ fontWeight: typography.medium }}>{formattedOriginal} {unit}</span>
                </div>
            )}

            <div style={disclaimerStyle}>
                {labels.simulatedTag}
            </div>
        </div>
    );
};

export default SimulatedMetricsCard;
