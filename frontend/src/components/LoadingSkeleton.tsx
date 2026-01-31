/**
 * LoadingSkeleton Component
 * 
 * Provides animated placeholder UI while content is loading.
 * Creates a polished loading experience with shimmer animation.
 */

import React from 'react';
import { colors, spacing } from '../designTokens';

interface LoadingSkeletonProps {
    variant?: 'card' | 'text' | 'chart' | 'metric';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    variant = 'text',
    width,
    height,
    count = 1
}) => {
    const baseStyle: React.CSSProperties = {
        backgroundColor: colors.gray200,
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden',
    };

    const shimmerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(
      90deg,
      ${colors.gray200} 0%,
      ${colors.gray100} 50%,
      ${colors.gray200} 100%
    )`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
    };

    const getVariantStyles = (): React.CSSProperties => {
        switch (variant) {
            case 'card':
                return {
                    width: width || '100%',
                    height: height || '120px',
                    borderRadius: '16px',
                };
            case 'chart':
                return {
                    width: width || '100%',
                    height: height || '320px',
                    borderRadius: '16px',
                };
            case 'metric':
                return {
                    width: width || '100%',
                    height: height || '100px',
                    borderRadius: '16px',
                };
            case 'text':
            default:
                return {
                    width: width || '100%',
                    height: height || '16px',
                    borderRadius: '4px',
                };
        }
    };

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
    };

    const elements = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            style={{
                ...baseStyle,
                ...getVariantStyles(),
            }}
        >
            <div style={shimmerStyle} />
        </div>
    ));

    return count > 1 ? (
        <div style={containerStyle}>{elements}</div>
    ) : (
        elements[0]
    );
};

// Compound components for common use cases
export const MetricSkeleton: React.FC = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg }}>
        <LoadingSkeleton variant="metric" />
        <LoadingSkeleton variant="metric" />
        <LoadingSkeleton variant="metric" />
    </div>
);

export const ChartSkeleton: React.FC = () => (
    <LoadingSkeleton variant="chart" />
);

export const CardSkeleton: React.FC = () => (
    <LoadingSkeleton variant="card" />
);

export default LoadingSkeleton;
