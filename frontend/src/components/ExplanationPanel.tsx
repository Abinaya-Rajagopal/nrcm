/**
 * ExplanationPanel Component
 * 
 * Displays progressive levels of explanation for the wound analysis:
 * Level 1: Status (What is it?)
 * Level 2: Reason (Why does it matter?)
 * Level 3: Logic (How did we calculate it?)
 */

import React, { useState } from 'react';

interface ExplanationPanelProps {
    status: string;
    reason: string;
    logic: string;
    riskLevel: 'GREEN' | 'AMBER' | 'RED' | string;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
    status,
    reason,
    logic,
    riskLevel
}) => {
    const [expanded, setExpanded] = useState(false);

    const getColors = (level: string) => {
        switch (level) {
            case 'RED': return { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', icon: '🔴' };
            case 'AMBER': return { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', icon: '🟠' };
            case 'GREEN': return { bg: '#F0FDF4', border: '#22C55E', text: '#166534', icon: '🟢' };
            default: return { bg: '#F3F4F6', border: '#9CA3AF', text: '#1F2937', icon: '⚪' };
        }
    };

    const colors = getColors(riskLevel);

    const containerStyle: React.CSSProperties = {
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        borderLeft: `6px solid ${colors.border}`,
    };

    const headerStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '20px',
        fontWeight: 700,
        color: '#111827',
        marginLeft: '12px',
        flex: 1,
    };

    const reasonStyle: React.CSSProperties = {
        fontSize: '16px',
        color: '#4B5563',
        lineHeight: 1.6,
        marginBottom: '16px',
        backgroundColor: colors.bg,
        padding: '12px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}30`,
    };

    const toggleStyle: React.CSSProperties = {
        color: '#6B7280',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'none',
        border: 'none',
        padding: 0,
        fontWeight: 500,
    };

    const logicStyle: React.CSSProperties = {
        marginTop: '16px',
        padding: '16px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#4B5563',
        border: '1px solid #E5E7EB',
    };

    return (
        <div style={containerStyle}>
            {/* Level 1: Status */}
            <div style={headerStyle}>
                <span style={{ fontSize: '24px' }}>{colors.icon}</span>
                <h3 style={titleStyle}>{status}</h3>
            </div>

            {/* Level 2: Reason */}
            <div style={reasonStyle}>
                <strong>Why:</strong> {reason}
            </div>

            {/* Level 3: Logic (Progressive Disclosure) */}
            <button
                style={toggleStyle}
                onClick={() => setExpanded(!expanded)}
            >
                <span>{expanded ? 'Hide' : 'Show'} AI Calculation Logic</span>
                <span>{expanded ? '▲' : '▼'}</span>
            </button>

            {expanded && (
                <div style={logicStyle}>
                    <strong>Algorithm Logic:</strong><br />
                    {logic}
                </div>
            )}
        </div>
    );
};

export default ExplanationPanel;
