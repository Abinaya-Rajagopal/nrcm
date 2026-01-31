/**
 * Design Tokens - Clinical Grade Healthcare UI
 * 
 * Two-Layer Visualization Architecture:
 * - Layer A: Visual Measurements (Ground Truth)
 * - Layer B: Contextual Simulations (Hypothetical)
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COLOR PALETTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const colors = {
    // Base palette - Clinical & calm
    white: '#FFFFFF',
    background: '#F8FAFC',
    backgroundAlt: '#F1F5F9',

    // Neutral grays
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',

    // Clinical blues
    blue50: '#EFF6FF',
    blue100: '#DBEAFE',
    blue200: '#BFDBFE',
    blue500: '#3B82F6',
    blue600: '#2563EB',
    blue700: '#1D4ED8',

    // Semantic risk colors ONLY
    riskGreen: '#22C55E',
    riskGreenBg: '#F0FDF4',
    riskGreenLight: '#DCFCE7',

    riskAmber: '#F59E0B',
    riskAmberBg: '#FFFBEB',
    riskAmberLight: '#FEF3C7',

    riskRed: '#EF4444',
    riskRedBg: '#FEF2F2',
    riskRedLight: '#FEE2E2',

    // Warning banner
    warningBg: '#FEF3C7',
    warningBorder: '#F59E0B',
    warningText: '#92400E',
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPOGRAPHY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const typography = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'SF Mono', 'Fira Code', 'Consolas', monospace",

    // Scale
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',

    // Weights
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SPACING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYER STYLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const layerStyles = {
    // Layer A - Ground Truth (Measurements)
    layerA: {
        border: `2px solid ${colors.gray200}`,
        borderRadius: '16px',
        background: colors.white,
        opacity: 1,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },

    // Layer B - Simulations (Hypothetical)
    layerB: {
        border: `2px dashed ${colors.gray300}`,
        borderRadius: '16px',
        background: colors.gray50,
        opacity: 0.9,
        boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RISK LEVEL UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type RiskLevel = 'GREEN' | 'AMBER' | 'RED';

export const riskConfig: Record<RiskLevel, {
    color: string;
    bg: string;
    light: string;
    label: string;
    icon: string;
}> = {
    GREEN: {
        color: colors.riskGreen,
        bg: colors.riskGreenBg,
        light: colors.riskGreenLight,
        label: 'On Track',
        icon: '🟢',
    },
    AMBER: {
        color: colors.riskAmber,
        bg: colors.riskAmberBg,
        light: colors.riskAmberLight,
        label: 'Needs Monitoring',
        icon: '🟡',
    },
    RED: {
        color: colors.riskRed,
        bg: colors.riskRedBg,
        light: colors.riskRedLight,
        label: 'Immediate Attention',
        icon: '🔴',
    },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SIMULATION MOCK DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SimulationContext {
    diabetesStatus: 'none' | 'type1' | 'type2' | 'unknown';
    smokingStatus: 'never' | 'former' | 'current' | 'unknown';
    ageRange: '18-40' | '41-60' | '61-80' | '80+' | 'unknown';
    surgeryCategory: 'minor' | 'major' | 'emergency' | 'unknown';
    hasReferenceObject: boolean;
}

export interface SimulationData {
    context: SimulationContext;
    adjustedTrajectory: number[];
    healingWindowStart: number; // days
    healingWindowEnd: number;   // days
    scaleNormalizedArea?: number;
}

// Default mock simulation data
export const mockSimulationData: SimulationData = {
    context: {
        diabetesStatus: 'type2',
        smokingStatus: 'former',
        ageRange: '41-60',
        surgeryCategory: 'major',
        hasReferenceObject: true,
    },
    adjustedTrajectory: [4.8, 4.3, 3.7, 3.2, 2.9, 2.5, 2.2],
    healingWindowStart: 12,
    healingWindowEnd: 18,
    scaleNormalizedArea: 3.8,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MANDATORY LABELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const labels = {
    measurementSource: 'Measured from the uploaded image using visual analysis.',
    simulationWarning: 'Simulation Mode: The visualizations below are hypothetical and based on assumptions. They do not represent real patient outcomes or clinical predictions.',
    simulatedTag: 'Simulated — based on assumptions. Not a prediction.',
    dashCurveCaption: 'Dashed curves represent simulated reference trends based on assumptions.',
    healingWindowTooltip: 'This window illustrates how trends extend visually under assumptions. It is not a medical prediction.',
    referenceObject: 'Reference object used only for scale-normalized simulation.',
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARED STYLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
} as const;

export const transitions = {
    fast: 'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow: 'all 0.3s ease',
} as const;
