/**
 * ChangeIndicator - Layer A Component
 * 
 * Displays "What changed since last capture?" micro-insight.
 * Shows ONLY measured changes, never simulated predictions.
 */

import React from 'react';
import { colors, typography, spacing } from '../../designTokens';

interface ChangeItem {
    metric: string;
    value: number;
    direction: 'up' | 'down';
}

interface ChangeIndicatorProps {
    changes: ChangeItem[];
    lastCaptureTime?: string;
}

export const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
    changes,
    lastCaptureTime = '2 days ago',
}) => {
    if (changes.length === 0) return null;

    const containerStyle: React.CSSProperties = {
        background: colors.blue50,
        border: `1px solid ${colors.blue100}`,
        borderRadius: '12px',
        padding: spacing.lg,
        marginTop: spacing.lg,
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: typography.sm,
        fontWeight: typography.semibold,
        color: colors.gray700,
    };

    const timeStyle: React.CSSProperties = {
        fontSize: typography.xs,
        color: colors.gray500,
    };

    const changesContainerStyle: React.CSSProperties = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing.sm,
    };

    const changeItemStyle = (direction: 'up' | 'down'): React.CSSProperties => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: `${spacing.xs} ${spacing.md}`,
        borderRadius: '999px',
        fontSize: typography.sm,
        fontWeight: typography.medium,
        background: direction === 'down' ? colors.riskGreenLight : colors.riskAmberLight,
        color: direction === 'down' ? '#166534' : '#92400E',
    });

    const arrowStyle: React.CSSProperties = {
        fontWeight: typography.bold,
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span style={{ fontSize: '16px' }}>📊</span>
                <span style={titleStyle}>Since last capture</span>
                <span style={timeStyle}>({lastCaptureTime})</span>
            </div>

            <div style={changesContainerStyle}>
                {changes.map((change, index) => (
                    <div key={index} style={changeItemStyle(change.direction)}>
                        <span>{change.metric}</span>
                        <span style={arrowStyle}>
                            {change.direction === 'down' ? '↓' : '↑'}
                        </span>
                        <span>{Math.abs(change.value).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChangeIndicator;
