/**
 * ComparisonSlider Component
 * 
 * Allows users to compare two images (Before vs After) using a draggable slider.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
    height?: string | number;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
    beforeImage,
    afterImage,
    beforeLabel = 'Day 1',
    afterLabel = 'Latest',
    height = '300px'
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    // Handle movement
    const handleMove = useCallback((clientX: number) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            setSliderPosition(percentage);
        }
    }, []);

    const handleMouseDown = useCallback(() => {
        isDragging.current = true;
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging.current) {
            handleMove(e.clientX);
        }
    }, [handleMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        handleMove(e.touches[0].clientX);
    }, [handleMove]);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, [handleMouseUp, handleMouseMove, handleTouchMove]);

    // Styles
    const containerStyle: React.CSSProperties = {
        position: 'relative',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'hidden',
        borderRadius: '12px',
        userSelect: 'none',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        cursor: 'ew-resize',
    };

    const imageStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        pointerEvents: 'none',
    };

    const afterImageStyle: React.CSSProperties = {
        ...imageStyle,
        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
    };

    const sliderLineStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: `${sliderPosition}%`,
        width: '2px',
        backgroundColor: '#fff',
        transform: 'translateX(-50%)',
        zIndex: 10,
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
    };

    const sliderHandleStyle: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        left: `${sliderPosition}%`,
        transform: 'translate(-50%, -50%)',
        width: '32px',
        height: '32px',
        backgroundColor: '#fff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 11,
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        color: '#3b82f6',
    };

    const labelStyle: React.CSSProperties = {
        position: 'absolute',
        top: '16px',
        padding: '4px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: '#fff',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        backdropFilter: 'blur(4px)',
        zIndex: 5,
    };

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onMouseDown={handleMouseDown}
            onTouchStart={() => isDragging.current = true}
        >
            {/* Before Image (Background) */}
            <img src={beforeImage} alt="Before" style={imageStyle} />
            <div style={{ ...labelStyle, right: '16px' }}>{beforeLabel}</div>

            {/* After Image (Foreground/Clipped) */}
            <img src={afterImage} alt="After" style={afterImageStyle} />
            <div style={{ ...labelStyle, left: '16px', zIndex: 6 }}>{afterLabel}</div>

            {/* Slider Line & Handle */}
            <div style={sliderLineStyle} />
            <div style={sliderHandleStyle}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 16L22 12L18 8V16ZM6 16V8L2 12L6 16Z" />
                </svg>
            </div>
        </div>
    );
};

export default ComparisonSlider;
