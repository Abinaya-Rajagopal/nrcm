/**
 * RiskBadge - Layer A Component
 * 
 * Prominent semantic risk level indicator.
 * Uses ONLY the three approved status levels:
 * - Green: On Track
 * - Amber: Needs Monitoring
 * - Red: Immediate Attention Required
 */

import React from 'react';
import { riskConfig, type RiskLevel, spacing, typography } from '../../designTokens';

interface RiskBadgeProps {
    level: RiskLevel;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
    level,
    size = 'md',
    showIcon = true,
}) => {
    const config = riskConfig[level];

    const sizeStyles = {
        sm: {
            padding: `${spacing.xs} ${spacing.md}`,
            fontSize: typography.xs,
            iconSize: '12px',
        },
        md: {
            padding: `${spacing.sm} ${spacing.lg}`,
            fontSize: typography.sm,
            iconSize: '16px',
        },
        lg: {
            padding: `${spacing.md} ${spacing.xl}`,
            fontSize: typography.base,
            iconSize: '20px',
        },
    };

    const styles = sizeStyles[size];

    const badgeStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: styles.padding,
        borderRadius: '999px',
        fontSize: styles.fontSize,
        fontWeight: typography.semibold,
        background: config.bg,
        color: level === 'GREEN' ? '#166534' : level === 'AMBER' ? '#92400E' : '#991B1B',
        border: `1px solid ${config.light}`,
        whiteSpace: 'nowrap',
    };

    const iconStyle: React.CSSProperties = {
        fontSize: styles.iconSize,
        lineHeight: 1,
    };

    return (
        <div style={badgeStyle}>
            {showIcon && <span style={iconStyle}>{config.icon}</span>}
            <span>{config.label}</span>
        </div>
    );
};

export default RiskBadge;
