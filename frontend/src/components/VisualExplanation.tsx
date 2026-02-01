import React, { useState } from 'react';
import { colors, typography, spacing } from '../designTokens';
import { type DebugSegmentationInfo, type DebugHeatmapData } from '../api/analyze';

interface VisualExplanationProps {
  originalImage: string;
  segmentation: DebugSegmentationInfo | null;
  heatmaps: DebugHeatmapData | null;
  isVisible: boolean;
}

type OverlayType = 'none' | 'wound_mask' | 'peri_mask' | 'redness' | 'exudate';

export const VisualExplanation: React.FC<VisualExplanationProps> = ({
  originalImage,
  segmentation,
  heatmaps,
  isVisible
}) => {
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>('none');

  if (!isVisible) return null;

  const isUnavailable = !segmentation || !heatmaps || (!heatmaps.enabled && !segmentation.wound_mask_base64);
  const errorReason = heatmaps?.reason || "Detailed visual overlays are unavailable for this image.";

  const containerStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: '16px',
    padding: spacing['2xl'],
    marginBottom: spacing['3xl'],
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${colors.gray200}`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.gray800,
    marginBottom: spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.xl,
    minHeight: '400px',
  };

  const viewerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: colors.gray100,
    border: `1px solid ${colors.gray200}`,
    aspectRatio: '4/3',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  };

  const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: active ? colors.blue50 : colors.white,
    color: active ? colors.blue700 : colors.gray600,
    border: `1px solid ${active ? colors.blue200 : colors.gray300}`,
    borderRadius: '8px',
    fontSize: typography.sm,
    fontWeight: active ? typography.bold : typography.medium,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  const disclaimerStyle: React.CSSProperties = {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: '8px',
    fontSize: typography.xs,
    color: colors.gray500,
    lineHeight: 1.5,
    borderLeft: `4px solid ${colors.gray300}`,
  };

  const unavailableStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    backgroundColor: colors.gray50,
    borderRadius: '12px',
    color: colors.gray500,
    fontSize: typography.sm,
    border: `1px dashed ${colors.gray300}`,
  };

  const renderActiveOverlay = () => {
    if (activeOverlay === 'none') return null;
    
    let src = '';
    let opacity = 0.5;

    if (activeOverlay === 'wound_mask') {
      src = `data:image/png;base64,${segmentation?.wound_mask_base64}`;
      opacity = 0.4;
    } else if (activeOverlay === 'peri_mask') {
      src = `data:image/png;base64,${segmentation?.peri_wound_mask_base64}`;
      opacity = 0.4;
    } else if (activeOverlay === 'redness') {
      src = `data:image/png;base64,${heatmaps?.redness_heatmap_base64}`;
      opacity = 0.6;
    } else if (activeOverlay === 'exudate') {
      src = `data:image/png;base64,${heatmaps?.exudate_heatmap_base64}`;
      opacity = 0.6;
    }

    if (!src || src.endsWith('undefined') || src.endsWith('null')) return null;

    return <img src={src} style={{ ...overlayStyle, opacity }} alt="Overlay" />;
  };

  const getHeatmapTitle = () => {
    switch(activeOverlay) {
        case 'redness': return 'Redness Intensity (Peri-wound)';
        case 'exudate': return 'Exudate Concentration (Wound Bed)';
        case 'wound_mask': return 'Detected Wound Boundary';
        case 'peri_mask': return 'Calculated Peri-wound Region';
        default: return 'Image Analysis Tools';
    }
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>
        <span>🔍</span>
        Visual Explanation (Derived from Image Analysis)
      </h2>

      {isUnavailable ? (
        <div style={unavailableStyle}>
          {errorReason}
        </div>
      ) : (
        <div style={gridStyle}>
          {/* LEFT PANEL: Original Image + Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            <div style={viewerStyle}>
              <img src={originalImage} style={overlayStyle} alt="Original Wound" />
              {renderActiveOverlay()}
            </div>
            
            <div style={controlsStyle}>
              <span style={{ fontSize: typography.xs, fontWeight: typography.bold, color: colors.gray500, textTransform: 'uppercase' }}>
                Overlay Selection
              </span>
              <button 
                style={toggleButtonStyle(activeOverlay === 'none')} 
                onClick={() => setActiveOverlay('none')}
              >
                Original Image {activeOverlay === 'none' && '✓'}
              </button>
              <button 
                style={toggleButtonStyle(activeOverlay === 'wound_mask')} 
                onClick={() => setActiveOverlay('wound_mask')}
              >
                Wound Mask {activeOverlay === 'wound_mask' && '✓'}
              </button>
              <button 
                style={toggleButtonStyle(activeOverlay === 'peri_mask')} 
                onClick={() => setActiveOverlay('peri_mask')}
              >
                Peri-Wound Mask {activeOverlay === 'peri_mask' && '✓'}
              </button>
              <button 
                disabled={!heatmaps?.redness_heatmap_base64}
                style={toggleButtonStyle(activeOverlay === 'redness')} 
                onClick={() => setActiveOverlay('redness')}
              >
                Redness Heatmap {activeOverlay === 'redness' && '✓'}
              </button>
              <button 
                disabled={!heatmaps?.exudate_heatmap_base64}
                style={toggleButtonStyle(activeOverlay === 'exudate')} 
                onClick={() => setActiveOverlay('exudate')}
              >
                Exudate Heatmap {activeOverlay === 'exudate' && '✓'}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: Detailed Explanation */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
                flex: 1, 
                padding: spacing.xl, 
                backgroundColor: colors.gray50, 
                borderRadius: '8px', 
                border: `1px solid ${colors.gray200}`,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h3 style={{ fontSize: typography.base, fontWeight: typography.bold, color: colors.gray800, marginBottom: spacing.md }}>
                    {getHeatmapTitle()}
                </h3>
                
                <div style={{ flex: 1, position: 'relative', marginBottom: spacing.lg }}>
                    <div style={{ ...viewerStyle, height: '100%', aspectRatio: 'auto' }}>
                        {activeOverlay === 'none' ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: spacing['2xl'], textAlign: 'center', color: colors.gray500 }}>
                                Select an overlay to explain specific metric contributions.
                            </div>
                        ) : (
                            <img 
                                src={
                                    activeOverlay === 'wound_mask' ? `data:image/png;base64,${segmentation?.wound_mask_base64}` :
                                    activeOverlay === 'peri_mask' ? `data:image/png;base64,${segmentation?.peri_wound_mask_base64}` :
                                    activeOverlay === 'redness' ? `data:image/png;base64,${heatmaps?.redness_heatmap_base64}` :
                                    activeOverlay === 'exudate' ? `data:image/png;base64,${heatmaps?.exudate_heatmap_base64}` :
                                    ''
                                } 
                                style={{ ...overlayStyle, backgroundColor: '#000' }} 
                                alt="Detail" 
                            />
                        )}
                    </div>
                </div>

                {activeOverlay !== 'none' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: spacing.sm }}>
                        <span style={{ fontSize: typography.xs, color: colors.gray500 }}>Low Intensity</span>
                        <div style={{ flex: 1, height: '8px', margin: `0 ${spacing.md}`, background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: typography.xs, color: colors.gray500 }}>High Intensity</span>
                    </div>
                )}
                
                <p style={{ marginTop: spacing.lg, fontSize: typography.sm, color: colors.gray600, lineHeight: 1.5 }}>
                    {activeOverlay === 'redness' && "Highlights regions with hues and saturations typically associated with inflammatory processes in the peri-wound area."}
                    {activeOverlay === 'exudate' && "Identifies concentrations of colors matching visual characteristics of exudates/pus within the wound bed."}
                    {activeOverlay === 'wound_mask' && "The identified boundary used for area calculation and spatial metric anchoring."}
                    {activeOverlay === 'peri_mask' && "A 20px dilation around the wound used to measure baseline skin inflammation/redness."}
                </p>
            </div>
          </div>
        </div>
      )}

      <div style={disclaimerStyle}>
        <strong>Disclaimer:</strong> Highlighted regions indicate areas contributing to the measured visual metrics. 
        These visualizations are explanatory and not diagnostic.
      </div>
    </div>
  );
};
