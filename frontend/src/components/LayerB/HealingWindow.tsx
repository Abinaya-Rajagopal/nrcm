/**
 * HealingWindow - Layer B Component
 * 
 * Displays a shaded healing completion RANGE (NOT exact dates).
 * This is a visual-only representation based on assumptions.
 * 
 * PROHIBITED: Exact dates, countdowns, percent confidence
 */

import React from 'react';
import { colors, typography, spacing, labels, layerStyles } from '../../designTokens';

interface HealingWindowProps {
    windowStart: number; // days
    windowEnd: number;   // days
    currentDay?: number;
}

export const HealingWindow: React.FC<HealingWindowProps> = ({
    windowStart,
    windowEnd,
    currentDay = 5,
}) => {
    const containerStyle: React.CSSProperties = {
        ...layerStyles.layerB,
        padding: spacing.xl,
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: typography.sm,
        fontWeight: typography.semibold,
        color: colors.gray600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    };

    const simulatedTagStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `2px ${spacing.sm}`,
        background: colors.gray100,
        border: `1px dashed ${colors.gray400}`,
        borderRadius: '999px',
        fontSize: '10px',
        fontWeight: typography.semibold,
        color: colors.gray500,
        textTransform: 'uppercase',
        marginLeft: 'auto',
    };

    // Visual timeline
    const totalDays = windowEnd + 5; // Add some buffer
    const timelineStyle: React.CSSProperties = {
        position: 'relative',
        height: '48px',
        background: colors.gray100,
        borderRadius: '8px',
        marginBottom: spacing.lg,
        overflow: 'hidden',
    };

    const windowStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${(windowStart / totalDays) * 100}%`,
        width: `${((windowEnd - windowStart) / totalDays) * 100}%`,
        top: 0,
        bottom: 0,
        background: `repeating-linear-gradient(
      -45deg,
      ${colors.riskAmberLight},
      ${colors.riskAmberLight} 4px,
      ${colors.riskAmberBg} 4px,
      ${colors.riskAmberBg} 8px
    )`,
        borderLeft: `2px dashed ${colors.riskAmber}`,
        borderRight: `2px dashed ${colors.riskAmber}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const currentDayMarkerStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${(currentDay / totalDays) * 100}%`,
        top: 0,
        bottom: 0,
        width: '3px',
        background: colors.blue500,
        zIndex: 2,
    };

    const currentDayLabelStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${(currentDay / totalDays) * 100}%`,
        top: '-20px',
        transform: 'translateX(-50%)',
        fontSize: typography.xs,
        fontWeight: typography.semibold,
        color: colors.blue600,
        whiteSpace: 'nowrap',
    };

    const rangeTextStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        gap: spacing.lg,
        marginBottom: spacing.lg,
    };

    const rangeItemStyle: React.CSSProperties = {
        textAlign: 'center',
    };

    const rangeLabelStyle: React.CSSProperties = {
        fontSize: typography.xs,
        color: colors.gray500,
        marginBottom: spacing.xs,
    };

    const rangeValueStyle: React.CSSProperties = {
        fontSize: typography.lg,
        fontWeight: typography.semibold,
        color: colors.gray700,
    };

    const disclaimerStyle: React.CSSProperties = {
        fontSize: '11px',
        color: colors.gray500,
        fontStyle: 'italic',
        lineHeight: 1.5,
        padding: spacing.md,
        background: colors.gray50,
        borderRadius: '8px',
        border: `1px dashed ${colors.gray300}`,
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span style={{ fontSize: '16px' }}>📅</span>
                <span style={titleStyle}>Simulated Healing Window</span>
                <span style={simulatedTagStyle}>Simulated</span>
            </div>

            <div style={{ position: 'relative', marginBottom: spacing['2xl'] }}>
                <div style={currentDayLabelStyle}>Today (Day {currentDay})</div>
                <div style={timelineStyle}>
                    <div style={currentDayMarkerStyle} />
                    <div style={windowStyle}>
                        <span style={{
                            fontSize: typography.xs,
                            fontWeight: typography.medium,
                            color: colors.gray600,
                        }}>
                            Expected Range
                        </span>
                    </div>
                </div>
            </div>

            <div style={rangeTextStyle}>
                <div style={rangeItemStyle}>
                    <div style={rangeLabelStyle}>Earliest</div>
                    <div style={rangeValueStyle}>Day {windowStart}</div>
                </div>
                <div style={{
                    fontSize: typography.xl,
                    color: colors.gray400,
                    alignSelf: 'center',
                }}>
                    →
                </div>
                <div style={rangeItemStyle}>
                    <div style={rangeLabelStyle}>Latest</div>
                    <div style={rangeValueStyle}>Day {windowEnd}</div>
                </div>
            </div>

            <div style={disclaimerStyle}>
                ⚠️ {labels.healingWindowTooltip}
            </div>
        </div>
    );
};

export default HealingWindow;
