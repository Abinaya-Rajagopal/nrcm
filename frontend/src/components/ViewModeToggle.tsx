/**
 * ViewModeToggle Component
 * 
 * Segmented control toggle between Clinician and Patient views.
 * 
 * Patient View: Simple status, before/after slider, reassuring language
 * Clinician View: Raw metrics, trajectories, technical details
 */

import React from 'react';
import { colors, typography, spacing, shadows, transitions } from '../designTokens';

export type ViewMode = 'patient' | 'clinician';

interface ViewModeToggleProps {
    mode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
    mode,
    onModeChange,
}) => {
    const containerStyle: React.CSSProperties = {
        display: 'inline-flex',
        background: colors.gray100,
        borderRadius: '12px',
        padding: '4px',
        gap: '4px',
    };

    const optionStyle = (isActive: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: `${spacing.sm} ${spacing.lg}`,
        borderRadius: '8px',
        border: 'none',
        background: isActive ? colors.white : 'transparent',
        boxShadow: isActive ? shadows.sm : 'none',
        fontSize: typography.sm,
        fontWeight: isActive ? typography.semibold : typography.medium,
        color: isActive ? colors.gray900 : colors.gray600,
        cursor: 'pointer',
        transition: transitions.fast,
    });

    const iconStyle: React.CSSProperties = {
        fontSize: '16px',
    };

    return (
        <div style={containerStyle} role="tablist">
            <button
                style={optionStyle(mode === 'patient')}
                onClick={() => onModeChange('patient')}
                role="tab"
                aria-selected={mode === 'patient'}
            >
                <span style={iconStyle}>👤</span>
                <span>Patient View</span>
            </button>

            <button
                style={optionStyle(mode === 'clinician')}
                onClick={() => onModeChange('clinician')}
                role="tab"
                aria-selected={mode === 'clinician'}
            >
                <span style={iconStyle}>👩‍⚕️</span>
                <span>Clinician View</span>
            </button>
        </div>
    );
};

export default ViewModeToggle;
