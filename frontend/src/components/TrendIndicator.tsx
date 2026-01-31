/**
 * TrendIndicator Component
 * 
 * Displays trend direction with percentage change.
 * Used to show whether metrics are improving or worsening.
 */

import React from 'react';
import { colors, typography, spacing } from '../designTokens';

type TrendDirection = 'up' | 'down' | 'stable';

interface TrendIndicatorProps {
    value: number; // percentage change
    direction: TrendDirection;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    invertColors?: boolean; // For metrics where "up" is bad (like wound area)
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
    value,
    direction,
    label,
    size = 'md',
    invertColors = true // Default: up is bad for wound metrics
}) => {
    const isPositive = invertColors
        ? direction === 'down'
        : direction === 'up';

    const isNegative = invertColors
        ? direction === 'up'
        : direction === 'down';

    const getColor = () => {
        if (direction === 'stable') return colors.gray500;
        if (isPositive) return colors.riskGreen;
        if (isNegative) return colors.riskRed;
        return colors.gray500;
    };

    const getBgColor = () => {
        if (direction === 'stable') return colors.gray100;
        if (isPositive) return colors.riskGreenBg;
        if (isNegative) return colors.riskRedBg;
        return colors.gray100;
    };

    const getSizeStyles = (): { fontSize: string; padding: string; iconSize: string } => {
        switch (size) {
            case 'sm':
                return { fontSize: typography.xs, padding: `${spacing.xs} ${spacing.sm}`, iconSize: '12px' };
            case 'lg':
                return { fontSize: typography.base, padding: `${spacing.sm} ${spacing.lg}`, iconSize: '20px' };
            case 'md':
            default:
                return { fontSize: typography.sm, padding: `${spacing.xs} ${spacing.md}`, iconSize: '16px' };
        }
    };

    const sizeStyles = getSizeStyles();
    const color = getColor();
    const bgColor = getBgColor();

    const containerStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: sizeStyles.padding,
        backgroundColor: bgColor,
        borderRadius: '999px',
        fontSize: sizeStyles.fontSize,
        fontWeight: typography.semibold,
        color: color,
        transition: 'all 0.2s ease',
    };

    const iconStyle: React.CSSProperties = {
        width: sizeStyles.iconSize,
        height: sizeStyles.iconSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const getIcon = () => {
        switch (direction) {
            case 'up':
                return (
                    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                );
            case 'down':
                return (
                    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                );
            default:
                return (
                    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14" />
                    </svg>
                );
        }
    };

    return (
        <span style={containerStyle}>
            {getIcon()}
            <span>{Math.abs(value).toFixed(1)}%</span>
            {label && <span style={{ color: colors.gray600, fontWeight: typography.normal }}>{label}</span>}
        </span>
    );
};

export default TrendIndicator;
