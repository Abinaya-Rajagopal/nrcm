/**
 * WarningBanner Component
 * 
 * Mandatory disclaimer banner for simulation mode.
 * Text is VERBATIM as specified in requirements.
 */

import React from 'react';
import { colors, typography, spacing, labels } from '../designTokens';

interface WarningBannerProps {
    visible: boolean;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ visible }) => {
    if (!visible) return null;

    const bannerStyle: React.CSSProperties = {
        background: colors.warningBg,
        border: `1px solid ${colors.warningBorder}`,
        borderLeft: `4px solid ${colors.warningBorder}`,
        borderRadius: '12px',
        padding: `${spacing.lg} ${spacing.xl}`,
        marginBottom: spacing['2xl'],
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.md,
        animation: 'fadeIn 0.3s ease',
    };

    const iconStyle: React.CSSProperties = {
        fontSize: '24px',
        flexShrink: 0,
        lineHeight: 1,
    };

    const contentStyle: React.CSSProperties = {
        flex: 1,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: typography.sm,
        fontWeight: typography.bold,
        color: colors.warningText,
        marginBottom: spacing.xs,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
    };

    const textStyle: React.CSSProperties = {
        fontSize: typography.sm,
        color: colors.warningText,
        lineHeight: 1.6,
        fontWeight: typography.medium,
    };

    return (
        <div style={bannerStyle} role="alert">
            <span style={iconStyle}>⚠️</span>
            <div style={contentStyle}>
                <div style={titleStyle}>
                    <span>Simulation Mode Active</span>
                </div>
                <p style={textStyle}>
                    {labels.simulationWarning}
                </p>
            </div>
        </div>
    );
};

export default WarningBanner;
