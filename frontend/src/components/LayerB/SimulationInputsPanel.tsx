/**
 * SimulationInputsPanel - Layer B Component
 * 
 * Displays the contextual inputs used for simulation.
 * Read-only display - shows what assumptions the simulation is based on.
 */

import React from 'react';
import { colors, typography, spacing, layerStyles, type SimulationContext } from '../../designTokens';

interface SimulationInputsPanelProps {
    context: SimulationContext;
}

const formatValue = (key: string, value: string | boolean): string => {
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    const mappings: Record<string, Record<string, string>> = {
        diabetesStatus: {
            none: 'None',
            type1: 'Type 1',
            type2: 'Type 2',
            unknown: 'Unknown',
        },
        smokingStatus: {
            never: 'Never',
            former: 'Former',
            current: 'Current',
            unknown: 'Unknown',
        },
        surgeryCategory: {
            minor: 'Minor',
            major: 'Major',
            emergency: 'Emergency',
            unknown: 'Unknown',
        },
    };

    return mappings[key]?.[value] || value;
};

const getLabel = (key: string): string => {
    const labels: Record<string, string> = {
        diabetesStatus: 'Diabetes',
        smokingStatus: 'Smoking',
        ageRange: 'Age Range',
        surgeryCategory: 'Surgery Type',
        hasReferenceObject: 'Reference Object',
    };
    return labels[key] || key;
};

const getIcon = (key: string): string => {
    const icons: Record<string, string> = {
        diabetesStatus: '🩺',
        smokingStatus: '🚭',
        ageRange: '📅',
        surgeryCategory: '🏥',
        hasReferenceObject: '🔍',
    };
    return icons[key] || '•';
};

export const SimulationInputsPanel: React.FC<SimulationInputsPanelProps> = ({ context }) => {
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

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: spacing.md,
    };

    const itemStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
    };

    const itemLabelStyle: React.CSSProperties = {
        fontSize: typography.xs,
        color: colors.gray500,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
    };

    const itemValueStyle: React.CSSProperties = {
        fontSize: typography.sm,
        fontWeight: typography.medium,
        color: colors.gray700,
    };

    const disclaimerStyle: React.CSSProperties = {
        marginTop: spacing.lg,
        paddingTop: spacing.md,
        borderTop: `1px dashed ${colors.gray300}`,
        fontSize: '11px',
        color: colors.gray500,
        fontStyle: 'italic',
    };

    const entries = Object.entries(context) as [keyof SimulationContext, string | boolean][];

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span style={{ fontSize: '16px' }}>⚙️</span>
                <span style={titleStyle}>Simulation Context</span>
            </div>

            <div style={gridStyle}>
                {entries.map(([key, value]) => (
                    <div key={key} style={itemStyle}>
                        <div style={itemLabelStyle}>
                            <span>{getIcon(key)}</span>
                            <span>{getLabel(key)}</span>
                        </div>
                        <div style={itemValueStyle}>
                            {formatValue(key, value)}
                        </div>
                    </div>
                ))}
            </div>

            <div style={disclaimerStyle}>
                These inputs are used to adjust the simulation. They do not affect measured values.
            </div>
        </div>
    );
};

export default SimulationInputsPanel;
