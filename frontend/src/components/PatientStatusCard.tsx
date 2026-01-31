/**
 * PatientStatusCard Component
 * 
 * Simplified, reassuring status display for Patient View.
 * Shows only:
 * - Simple healing status text
 * - Reassuring, non-technical language
 */

import React from 'react';
import { colors, typography, spacing, riskConfig, type RiskLevel } from '../designTokens';

interface PatientStatusCardProps {
    riskLevel: RiskLevel;
}

const getPatientFriendlyStatus = (level: RiskLevel) => {
    switch (level) {
        case 'GREEN':
            return {
                title: 'Healing Normally',
                message: 'Your wound is healing well. Continue following your care instructions.',
                icon: '✨',
                gradient: `linear-gradient(135deg, ${colors.riskGreenBg} 0%, ${colors.white} 100%)`,
                borderColor: colors.riskGreenLight,
            };
        case 'AMBER':
            return {
                title: 'Slower Than Expected',
                message: 'Your wound healing is progressing, but a bit slower than typical. Your care team is monitoring this.',
                icon: '👀',
                gradient: `linear-gradient(135deg, ${colors.riskAmberBg} 0%, ${colors.white} 100%)`,
                borderColor: colors.riskAmberLight,
            };
        case 'RED':
            return {
                title: 'Needs Attention',
                message: 'Your care team would like to review your wound. Please follow up with your healthcare provider.',
                icon: '📞',
                gradient: `linear-gradient(135deg, ${colors.riskRedBg} 0%, ${colors.white} 100%)`,
                borderColor: colors.riskRedLight,
            };
    }
};

export const PatientStatusCard: React.FC<PatientStatusCardProps> = ({ riskLevel }) => {
    const status = getPatientFriendlyStatus(riskLevel);
    const risk = riskConfig[riskLevel];

    const cardStyle: React.CSSProperties = {
        background: status.gradient,
        border: `2px solid ${status.borderColor}`,
        borderRadius: '20px',
        padding: spacing['4xl'],
        textAlign: 'center',
    };

    const iconStyle: React.CSSProperties = {
        fontSize: '64px',
        marginBottom: spacing.xl,
        display: 'block',
    };

    const badgeStyle: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: `${spacing.sm} ${spacing.xl}`,
        borderRadius: '999px',
        background: risk.bg,
        color: riskLevel === 'GREEN' ? '#166534' : riskLevel === 'AMBER' ? '#92400E' : '#991B1B',
        fontSize: typography.sm,
        fontWeight: typography.semibold,
        marginBottom: spacing.xl,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '28px',
        fontWeight: typography.bold,
        color: colors.gray900,
        marginBottom: spacing.md,
    };

    const messageStyle: React.CSSProperties = {
        fontSize: typography.base,
        color: colors.gray600,
        maxWidth: '400px',
        margin: '0 auto',
        lineHeight: 1.7,
    };

    return (
        <div style={cardStyle}>
            <span style={iconStyle}>{status.icon}</span>

            <div style={badgeStyle}>
                <span>{risk.icon}</span>
                <span>{risk.label}</span>
            </div>

            <h2 style={titleStyle}>{status.title}</h2>
            <p style={messageStyle}>{status.message}</p>
        </div>
    );
};

export default PatientStatusCard;
