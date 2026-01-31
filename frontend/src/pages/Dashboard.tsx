/**
 * Dashboard Page - Clinical Grade Wound Monitoring
 * 
 * ARCHITECTURAL RULES:
 * 1. Layer A (Ground Truth) - ALWAYS visible by default
 * 2. Layer B (Simulation) - ONLY visible after explicit user action
 * 3. View modes: Patient (simplified) vs Clinician (technical)
 * 
 * This dashboard enforces regulatory-aware language throughout.
 */

import React, { useEffect, useState } from 'react';

// Layer A Components
import { MeasuredMetricsCard, RiskBadge, ChangeIndicator } from '../components/LayerA';

// Layer B Components
import { SimulatedMetricsCard, SimulationInputsPanel, HealingWindow } from '../components/LayerB';

// Shared Components
import { TrajectoryChart } from '../components/TrajectoryChart';
import { ComparisonSlider } from '../components/ComparisonSlider';
import { SimulationToggle } from '../components/SimulationToggle';
import { WarningBanner } from '../components/WarningBanner';
import { ViewModeToggle, type ViewMode } from '../components/ViewModeToggle';
import { MeasurementLabel } from '../components/MeasurementLabel';
import { PatientStatusCard } from '../components/PatientStatusCard';

// API & Data
import { analyzeWound, type AnalyzeResponse } from '../api/analyze';
import {
  colors,
  typography,
  spacing,
  mockSimulationData,
  type RiskLevel,
} from '../designTokens';

// Mock images for demonstration
const BEFORE_IMAGE = "https://placehold.co/800x600/e2e8f0/475569?text=Day+1:+Initial+Wound";
const AFTER_IMAGE = "https://placehold.co/800x600/cbd5e1/1e293b?text=Day+5:+Current+Status";

export const Dashboard: React.FC = () => {
  // Core data state
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('clinician');

  // Simulation state - OFF by default (Layer B hidden)
  const [simulationMode, setSimulationMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyzeWound({ use_demo_image: true });
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Mock change data (would come from API comparing images)
  const mockChanges = [
    { metric: 'Wound Area', value: 8, direction: 'down' as const },
    { metric: 'Redness', value: 12, direction: 'down' as const },
  ];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STYLES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const containerStyle: React.CSSProperties = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: `${spacing['4xl']} ${spacing.xl}`,
    fontFamily: typography.fontFamily,
    color: colors.gray800,
    minHeight: '100vh',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing['4xl'],
  };

  const headerTopStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography['4xl'],
    fontWeight: typography.extrabold,
    color: colors.gray900,
    marginBottom: spacing.sm,
    letterSpacing: '-0.02em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: typography.base,
    color: colors.gray500,
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.lg,
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: spacing['2xl'],
  };

  const colMainStyle: React.CSSProperties = {
    gridColumn: 'span 8',
  };

  const colSideStyle: React.CSSProperties = {
    gridColumn: 'span 4',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: spacing['3xl'],
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.gray800,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: spacing.lg,
  };

  const layerBSectionStyle: React.CSSProperties = {
    marginTop: spacing['3xl'],
    paddingTop: spacing['2xl'],
    borderTop: `2px dashed ${colors.gray300}`,
  };

  const layerBHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.gray600,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const refreshButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.xl}`,
    background: colors.blue500,
    color: colors.white,
    border: 'none',
    borderRadius: '10px',
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.2s',
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LOADING & ERROR STATES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.lg }}>🔬</div>
          <div style={{ fontSize: typography.lg, color: colors.gray600 }}>Analyzing wound image...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center',
          padding: spacing['4xl'],
          background: colors.riskRedBg,
          borderRadius: '16px',
          border: `2px solid ${colors.riskRedLight}`,
        }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.lg }}>⚠️</div>
          <div style={{ fontSize: typography.lg, color: colors.riskRed, marginBottom: spacing.lg }}>
            {error || 'Unable to load data'}
          </div>
          <button style={refreshButtonStyle} onClick={fetchData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PATIENT VIEW (Simplified)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (viewMode === 'patient') {
    return (
      <div style={containerStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div style={headerTopStyle}>
            <div>
              <h1 style={titleStyle}>Your Healing Progress</h1>
              <p style={subtitleStyle}>Post-Operative Day 5</p>
            </div>
            <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
          </div>
        </header>

        {/* Simple Status Card */}
        <section style={{ marginBottom: spacing['3xl'] }}>
          <PatientStatusCard riskLevel={data.risk_level as RiskLevel} />
        </section>

        {/* Before/After Comparison - Primary Interaction */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>
              <span>👁️</span>
              <span>Visual Comparison</span>
            </h2>
          </div>
          <ComparisonSlider
            beforeImage={BEFORE_IMAGE}
            afterImage={AFTER_IMAGE}
            beforeLabel="Day 1"
            afterLabel="Today"
            height={400}
          />
        </section>

        {/* Reassuring footer */}
        <div style={{
          textAlign: 'center',
          padding: spacing['2xl'],
          background: colors.blue50,
          borderRadius: '16px',
          border: `1px solid ${colors.blue100}`,
        }}>
          <p style={{ fontSize: typography.sm, color: colors.gray600 }}>
            💬 If you have any concerns, please contact your healthcare provider.
          </p>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLINICIAN VIEW (Full Technical Details)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={headerTopStyle}>
          <div>
            <h1 style={titleStyle}>Wound Monitoring</h1>
            <p style={subtitleStyle}>Patient ID: #8492 • Post-Operative Day 5</p>
          </div>
          <div style={controlsStyle}>
            <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
            <button style={refreshButtonStyle} onClick={fetchData}>
              <span>📷</span>
              <span>Analyze New Image</span>
            </button>
          </div>
        </div>
      </header>

      {/* Simulation Warning Banner */}
      <WarningBanner visible={simulationMode} />

      {/* Main Grid */}
      <div style={gridStyle}>

        {/* ━━━━━━━━ LEFT COLUMN: Visuals & Charts ━━━━━━━━ */}
        <div style={colMainStyle}>

          {/* Visual Progression - Primary Interaction */}
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>
                <span>👁️</span>
                <span>Visual Progression</span>
              </h2>
            </div>
            <ComparisonSlider
              beforeImage={BEFORE_IMAGE}
              afterImage={AFTER_IMAGE}
              height={380}
            />
          </section>

          {/* Healing Trajectory Chart */}
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>
                <span>📈</span>
                <span>Healing Trajectory</span>
              </h2>
            </div>
            <TrajectoryChart
              data={data.trajectory}
              simulationMode={simulationMode}
              simulationData={mockSimulationData}
              height={320}
            />
          </section>

          {/* LAYER B SECTION - Only visible when simulation is enabled */}
          {simulationMode && (
            <section style={layerBSectionStyle}>
              <div style={layerBHeaderStyle}>
                <span>◇</span>
                <span>Contextual Simulation (Layer B)</span>
              </div>

              {/* Simulation Inputs */}
              <div style={{ marginBottom: spacing.xl }}>
                <SimulationInputsPanel context={mockSimulationData.context} />
              </div>

              {/* Healing Window */}
              <HealingWindow
                windowStart={mockSimulationData.healingWindowStart}
                windowEnd={mockSimulationData.healingWindowEnd}
                currentDay={5}
              />
            </section>
          )}
        </div>

        {/* ━━━━━━━━ RIGHT COLUMN: Metrics & Controls ━━━━━━━━ */}
        <div style={colSideStyle}>

          {/* Risk Level Badge */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <RiskBadge level={data.risk_level as RiskLevel} size="lg" />
          </section>

          {/* Measurement Source Label - MANDATORY */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <MeasurementLabel />
          </section>

          {/* LAYER A: Measured Metrics */}
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>
                <span>📊</span>
                <span>Measured Metrics</span>
              </h2>
            </div>
            <div style={metricsGridStyle}>
              <MeasuredMetricsCard
                label="Wound Area"
                value={data.area_cm2}
                unit="cm²"
              />
              <MeasuredMetricsCard
                label="Redness"
                value={data.redness_pct}
                unit="%"
                riskLevel={data.redness_pct > 15 ? 'AMBER' : 'GREEN'}
              />
              <MeasuredMetricsCard
                label="Exudate"
                value={data.pus_pct}
                unit="%"
                riskLevel={data.pus_pct > 5 ? 'RED' : 'GREEN'}
              />
            </div>

            {/* Change Indicator */}
            <ChangeIndicator changes={mockChanges} lastCaptureTime="2 days ago" />
          </section>

          {/* Simulation Toggle */}
          <section style={sectionStyle}>
            <SimulationToggle
              enabled={simulationMode}
              onToggle={setSimulationMode}
            />
          </section>

          {/* LAYER B: Simulated Metrics - Only when enabled */}
          {simulationMode && (
            <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={{ ...sectionTitleStyle, color: colors.gray600 }}>
                  <span>◇</span>
                  <span>Simulated Metrics</span>
                </h2>
              </div>
              <div style={metricsGridStyle}>
                <SimulatedMetricsCard
                  label="Scale-Normalized Area"
                  value={mockSimulationData.scaleNormalizedArea || 0}
                  unit="cm²"
                  originalValue={data.area_cm2}
                />
              </div>
            </section>
          )}

          {/* Alert Reason */}
          {data.alert_reason && (
            <section style={{
              background: colors.riskAmberBg,
              border: `1px solid ${colors.riskAmberLight}`,
              borderRadius: '12px',
              padding: spacing.lg,
            }}>
              <div style={{
                fontSize: typography.xs,
                fontWeight: typography.semibold,
                color: colors.gray600,
                marginBottom: spacing.sm,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Alert Reason
              </div>
              <p style={{
                fontSize: typography.sm,
                color: colors.gray700,
                lineHeight: 1.6,
              }}>
                {data.alert_reason}
              </p>
            </section>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
