/**
 * MeasurementLabel Component
 * 
 * Mandatory label indicating data source for Layer A metrics.
 * Text: "Measured from the uploaded image using visual analysis."
 */

import React from 'react';
import { colors, typography, spacing, labels } from '../designTokens';

interface MeasurementLabelProps {
    compact?: boolean;
}

export const MeasurementLabel: React.FC<MeasurementLabelProps> = ({
    compact = false
}) => {
    const labelStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.sm,
        fontSize: compact ? typography.xs : typography.sm,
        color: colors.gray500,
        background: colors.gray50,
        padding: compact ? `${spacing.xs} ${spacing.sm}` : `${spacing.sm} ${spacing.md}`,
        borderRadius: '8px',
        border: `1px solid ${colors.gray200}`,
    };

    const iconStyle: React.CSSProperties = {
        fontSize: compact ? '12px' : '14px',
    };

    return (
        <div style={labelStyle}>
            <span style={iconStyle}>📷</span>
            <span>{labels.measurementSource}</span>
        </div>
    );
};

export default MeasurementLabel;
