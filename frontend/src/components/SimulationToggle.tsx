/**
 * SimulationToggle Component
 * 
 * Toggle to reveal Layer B simulation visualizations.
 * OFF by default - explicit user action required.
 * 
 * Label: "Explore Contextual Simulation"
 */

import React from 'react';
import { colors, typography, spacing, transitions } from '../designTokens';

interface SimulationToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const SimulationToggle: React.FC<SimulationToggleProps> = ({
    enabled,
    onToggle,
}) => {
    const containerStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.md} ${spacing.xl}`,
        background: enabled ? colors.gray50 : colors.white,
        border: `1px solid ${enabled ? colors.gray300 : colors.gray200}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: transitions.normal,
    };

    const switchStyle: React.CSSProperties = {
        position: 'relative',
        width: '48px',
        height: '26px',
        background: enabled ? colors.blue500 : colors.gray200,
        borderRadius: '999px',
        transition: transitions.normal,
        flexShrink: 0,
    };

    const knobStyle: React.CSSProperties = {
        position: 'absolute',
        top: '3px',
        left: enabled ? '25px' : '3px',
        width: '20px',
        height: '20px',
        background: colors.white,
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: transitions.normal,
    };

    const labelContainerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: typography.sm,
        fontWeight: typography.semibold,
        color: colors.gray800,
    };

    const descriptionStyle: React.CSSProperties = {
        fontSize: typography.xs,
        color: colors.gray500,
    };

    const iconStyle: React.CSSProperties = {
        fontSize: '18px',
        opacity: enabled ? 1 : 0.5,
        transition: transitions.normal,
    };

    return (
        <div
            style={containerStyle}
            onClick={() => onToggle(!enabled)}
            role="switch"
            aria-checked={enabled}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle(!enabled);
                }
            }}
        >
            <span style={iconStyle}>🔬</span>

            <div style={labelContainerStyle}>
                <span style={labelStyle}>Explore Contextual Simulation</span>
                <span style={descriptionStyle}>
                    {enabled ? 'Showing hypothetical scenarios' : 'View what-if analysis'}
                </span>
            </div>

            <div style={switchStyle}>
                <div style={knobStyle} />
            </div>
        </div>
    );
};

export default SimulationToggle;
