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
import { ExplanationPanel } from '../components/ExplanationPanel';
import { AlertCard } from '../components/AlertCard';
import { LoadingSkeleton, MetricSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import { TrendIndicator } from '../components/TrendIndicator';

// API & Data
import { analyzeWound, type AnalyzeResponse } from '../api/analyze';
import {
  colors,
  typography,
  spacing,
  mockSimulationData,
  riskConfig,
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

  // Timeline state
  const [selectedDay, setSelectedDay] = useState(1); // Default to Day 1 initially
  const [observations, setObservations] = useState<{ day: number, img: string }[]>([]);

  // Simulation state - OFF by default (Layer B hidden)
  const [simulationMode, setSimulationMode] = useState(false);

  useEffect(() => {
    // Only fetch if we have images, otherwise wait for upload
    if (observations.length > 0) {
        fetchData();
    }
  }, [simulationMode]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // Append new observation
        const newDayIndex = observations.length + 1;
        const newObs = { day: newDayIndex, img: base64String };
        const updatedObs = [...observations, newObs];
        
        setObservations(updatedObs);
        setSelectedDay(newDayIndex); // Auto-select latest
        
        // Pass specifically this image for analysis
        fetchData(base64String, updatedObs);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async (customImageBase64?: string, currentObservations?: { day: number, img: string }[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const requestData: any = { 
        enable_simulation: simulationMode 
      };

      if (customImageBase64) {
        requestData.image_base64 = customImageBase64;
        requestData.use_demo_image = false;
      } else {
        // If no specific image passed, use the latest one from state
        const obsToUse = currentObservations || observations;
        if (obsToUse.length > 0) {
            requestData.image_base64 = obsToUse[obsToUse.length - 1].img;
            requestData.use_demo_image = false;
        } else {
            requestData.use_demo_image = true;
        }
      }

      const response = await analyzeWound(requestData);
      setData(response);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPUTED VALUES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Resolve Images for Comparison
  // CRITICAL FIX: Left is ALWAYS Day 1 (Baseline). Right is Day N (Selected).
  const baselineImage = observations.length > 0 ? observations[0].img : BEFORE_IMAGE;
  const currentImage = observations.length > 0 
    ? (observations[selectedDay - 1]?.img || observations[observations.length - 1].img) 
    : AFTER_IMAGE;

  // Get metrics for selected day
  const getMetricsForDay = (day: number) => {
    if (!data?.measurement?.trajectory) return null;
    const index = day - 1;
    const actual = data.measurement.trajectory.actual[index];
    const expected = data.measurement.trajectory.expected[index];
    const prevActual = index > 0 ? data.measurement.trajectory.actual[index - 1] : actual;

    if (actual === undefined || expected === undefined) return null;

    const deviation = actual - expected;
    const changeFromPrev = prevActual ? ((actual - prevActual) / prevActual) * 100 : 0;

    return {
      actual,
      expected,
      deviation,
      changeFromPrev,
      direction: changeFromPrev > 0.1 ? 'up' as const :
        changeFromPrev < -0.1 ? 'down' as const : 'stable' as const
    };
  };

  const dayMetrics = getMetricsForDay(selectedDay);

  // Generate explanation content based on data
  const getExplanation = () => {
    if (!data?.measurement) return null;

    const risk = data.measurement.risk_level as RiskLevel;
    const config = riskConfig[risk];

    let status = config.label;
    let reason = data.measurement.alert_reason || 'Wound healing is progressing as expected for this post-operative stage.';
    let logic = '';

    if (risk === 'GREEN') {
      logic = `Risk Assessment: GREEN\n• Wound area: ${data.measurement.area_cm2.toFixed(1)} cm² (within expected range)\n• Redness: ${data.measurement.redness_pct.toFixed(1)}% (acceptable levels)\n• Exudate: ${data.measurement.pus_pct.toFixed(1)}% (minimal)\n• Trajectory: Following expected healing curve`;
    } else if (risk === 'AMBER') {
      logic = `Risk Assessment: AMBER\n• Wound area: ${data.measurement.area_cm2.toFixed(1)} cm² (deviation detected)\n• Redness: ${data.measurement.redness_pct.toFixed(1)}% (${data.measurement.redness_pct > 15 ? 'elevated' : 'normal'})\n• Exudate: ${data.measurement.pus_pct.toFixed(1)}% (${data.measurement.pus_pct > 5 ? 'elevated' : 'normal'})\n• Trajectory: Slower than expected healing rate`;
    } else {
      logic = `Risk Assessment: RED\n• Wound area: ${data.measurement.area_cm2.toFixed(1)} cm² (significantly above expected)\n• Redness: ${data.measurement.redness_pct.toFixed(1)}% (requires attention)\n• Exudate: ${data.measurement.pus_pct.toFixed(1)}% (elevated)\n• Trajectory: Healing stalled or regressing`;
    }

    return { status, reason, logic, riskLevel: risk };
  };

  const explanation = getExplanation();

  // Generate alert cards data
  const getAlerts = () => {
    if (!data || !dayMetrics) return [];

    const alerts: Array<{
      id: string;
      title: string;
      description: string;
      metric?: { label: string; value: number; unit: string; change?: number; direction?: 'up' | 'down' | 'stable' };
      severity: RiskLevel;
    }> = [];

    // Check wound area deviation
    if (Math.abs(dayMetrics.deviation) > 0.5) {
      alerts.push({
        id: 'area-deviation',
        title: dayMetrics.deviation > 0 ? 'Wound Area Above Expected' : 'Wound Area Below Expected',
        description: `Current wound area deviates from the expected healing trajectory by ${Math.abs(dayMetrics.deviation).toFixed(1)} cm².`,
        metric: {
          label: 'Deviation',
          value: Math.abs(dayMetrics.deviation),
          unit: 'cm²',
          change: (dayMetrics.deviation / dayMetrics.expected) * 100,
          direction: dayMetrics.deviation > 0 ? 'up' : 'down'
        },
        severity: Math.abs(dayMetrics.deviation) > 1.5 ? 'RED' : 'AMBER'
      });
    }

    // Check redness
    if (data.measurement.redness_pct > 15) {
      alerts.push({
        id: 'redness-elevated',
        title: 'Elevated Redness Detected',
        description: `Peri-wound redness is at ${data.measurement.redness_pct.toFixed(1)}%, which is above the normal threshold of 15%.`,
        metric: {
          label: 'Redness',
          value: data.measurement.redness_pct,
          unit: '%',
          change: data.measurement.redness_pct - 15,
          direction: 'up'
        },
        severity: data.measurement.redness_pct > 25 ? 'RED' : 'AMBER'
      });
    }

    // Check exudate
    if (data.measurement.pus_pct > 5) {
      alerts.push({
        id: 'exudate-elevated',
        title: 'Exudate Level Elevated',
        description: `Exudate/pus percentage is at ${data.measurement.pus_pct.toFixed(1)}%, exceeding the 5% threshold.`,
        metric: {
          label: 'Exudate',
          value: data.measurement.pus_pct,
          unit: '%',
          change: data.measurement.pus_pct - 5,
          direction: 'up'
        },
        severity: 'RED'
      });
    }

    // If no alerts, show positive status
    if (alerts.length === 0) {
      alerts.push({
        id: 'on-track',
        title: 'Healing On Track',
        description: 'All wound metrics are within expected parameters. Continue current care protocol.',
        severity: 'GREEN'
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STYLES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const containerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `${spacing['4xl']} ${spacing.xl}`,
    fontFamily: typography.fontFamily,
    color: colors.gray800,
    minHeight: '100vh',
    background: `linear-gradient(180deg, ${colors.gray50} 0%, ${colors.white} 100%)`,
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: spacing['3xl'],
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
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
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
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: spacing.md,
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
    background: `linear-gradient(135deg, ${colors.blue500} 0%, ${colors.blue600} 100%)`,
    color: colors.white,
    border: 'none',
    borderRadius: '10px',
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.2s',
  };

  const sliderContainerStyle: React.CSSProperties = {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: '12px',
    border: `1px solid ${colors.gray200}`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
  };

  const sliderLabelStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.gray700,
  };

  const rangeInputStyle: React.CSSProperties = {
    width: '100%',
    cursor: 'pointer',
    accentColor: colors.blue500,
  };

  const alertsSectionStyle: React.CSSProperties = {
    marginBottom: spacing['2xl'],
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LOADING STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (loading) {
    return (
      <div style={containerStyle}>
        <header style={headerStyle}>
          <LoadingSkeleton variant="text" width="300px" height="40px" />
          <LoadingSkeleton variant="text" width="200px" height="20px" />
        </header>
        <div style={gridStyle}>
          <div style={colMainStyle}>
            <ChartSkeleton />
            <div style={{ marginTop: spacing.xl }}>
              <ChartSkeleton />
            </div>
          </div>
          <div style={colSideStyle}>
            <LoadingSkeleton variant="card" height="80px" />
            <div style={{ marginTop: spacing.lg }}>
              <MetricSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ERROR STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (error || !data) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center',
          padding: spacing['4xl'],
          background: colors.riskRedBg,
          borderRadius: '16px',
          border: `2px solid ${colors.riskRedLight}`,
          maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.lg }}>⚠️</div>
          <div style={{ fontSize: typography.lg, color: colors.riskRed, marginBottom: spacing.lg, fontWeight: typography.semibold }}>
            {error || 'Unable to load data'}
          </div>
          <p style={{ fontSize: typography.sm, color: colors.gray600, marginBottom: spacing.xl }}>
            Please check your connection and try again. If the problem persists, contact support.
          </p>
          <button style={refreshButtonStyle} onClick={() => fetchData()}>
            🔄 Try Again
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
        <header style={headerStyle}>
          <div style={headerTopStyle}>
            <div>
              <h1 style={titleStyle}>Your Healing Progress</h1>
              <p style={subtitleStyle}>Post-Operative Day {selectedDay}</p>
            </div>
            <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
          </div>
        </header>

        {/* Simple Status Card */}
        <section style={{ marginBottom: spacing['3xl'] }}>
          <PatientStatusCard riskLevel={data.measurement.risk_level as RiskLevel} />
        </section>

        {/* Explanation Panel for Patients */}
        {explanation && (
          <section style={{ marginBottom: spacing['3xl'] }}>
            <ExplanationPanel
              status={explanation.status}
              reason={explanation.reason}
              logic={explanation.logic}
              riskLevel={explanation.riskLevel}
            />
          </section>
        )}

        {/* Before/After Comparison */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>
              <span>👁️</span>
              <span>Visual Comparison</span>
            </h2>
          </div>
          <ComparisonSlider
            beforeImage={baselineImage}
            afterImage={currentImage}
            beforeLabel="Day 1"
            afterLabel={`Day ${selectedDay}`}
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
            <h1 style={titleStyle}>Wound Monitoring Dashboard</h1>
            <div style={subtitleStyle}>
              <span>Patient ID: #8492</span>
              <span>•</span>
              <span>Post-Operative Day {selectedDay}</span>
              {dayMetrics && (
                <>
                  <span>•</span>
                  <TrendIndicator
                    value={Math.abs(dayMetrics.changeFromPrev)}
                    direction={dayMetrics.direction}
                    size="sm"
                  />
                </>
              )}
            </div>
          </div>
          <div style={controlsStyle}>
            <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <button style={refreshButtonStyle} onClick={() => fileInputRef.current?.click()}>
              <span>📷</span>
              <span>Upload & Analyze</span>
            </button>
          </div>
        </div>
      </header>

      {/* Simulation Warning Banner */}
      <WarningBanner visible={simulationMode} />

      {/* Progressive Explanation Panel */}
      {explanation && (
        <section style={{ marginBottom: spacing['2xl'] }}>
          <ExplanationPanel
            status={explanation.status}
            reason={explanation.reason}
            logic={explanation.logic}
            riskLevel={explanation.riskLevel}
          />
        </section>
      )}

      {/* Main Grid */}
      <div style={gridStyle}>

        {/* ━━━━━━━━ LEFT COLUMN: Visuals & Charts ━━━━━━━━ */}
        <div style={colMainStyle}>

          {/* Visual Progression */}
          <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>
                <span>👁️</span>
                <span>Visual Progression</span>
              </h2>
            </div>
            <ComparisonSlider
              beforeImage={baselineImage}
              afterImage={currentImage}
              beforeLabel="Day 1"
              afterLabel={`Day ${selectedDay}`}
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
              {dayMetrics && (
                <div style={{ fontSize: typography.sm, color: colors.gray500 }}>
                  Day {selectedDay}: {dayMetrics.actual.toFixed(1)} cm²
                  <span style={{ marginLeft: spacing.sm }}>
                    (Expected: {dayMetrics.expected.toFixed(1)} cm²)
                  </span>
                </div>
              )}
            </div>
            <TrajectoryChart
              data={data.measurement.trajectory}
              simulationMode={simulationMode}
              simulationData={data.simulation || undefined}
              height={320}
              selectedDay={selectedDay}
            />

            {/* Timeline Slider */}
            <div style={sliderContainerStyle}>
              <div style={sliderLabelStyle}>
                <span>📅 Timeline Control</span>
                <span style={{ fontWeight: typography.bold, color: colors.blue600 }}>
                  Day {selectedDay} of {data.measurement.trajectory.expected.length}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={data.measurement.trajectory.expected.length}
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                style={rangeInputStyle}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.xs, color: colors.gray400, marginTop: spacing.xs }}>
                <span>Day 1</span>
                <span>Day {data.measurement.trajectory.expected.length}</span>
              </div>
            </div>
          </section>

          {/* LAYER B SECTION */}
          {simulationMode && (
            <section style={layerBSectionStyle}>
              <div style={layerBHeaderStyle}>
                <span>◇</span>
                <span>Contextual Simulation (Layer B)</span>
              </div>
              <div style={{ marginBottom: spacing.xl }}>
                {/* Inputs are effectively static for this demo since image is fixed */}
                <SimulationInputsPanel context={mockSimulationData.context} />
              </div>
              {data.simulation?.completion_window_days && (
                <HealingWindow
                  windowStart={data.simulation.completion_window_days[0]}
                  windowEnd={data.simulation.completion_window_days[1]}
                  currentDay={selectedDay}
                />
              )}
            </section>
          )}
        </div>

        {/* ━━━━━━━━ RIGHT COLUMN: Metrics & Controls ━━━━━━━━ */}
        <div style={colSideStyle}>

          {/* Risk Level Badge */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <RiskBadge level={data.measurement.risk_level as RiskLevel} size="lg" />
          </section>

          {/* Explainable Alerts Section */}
          <section style={alertsSectionStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>
                <span>🔔</span>
                <span>Alerts & Insights</span>
              </h2>
            </div>
            {alerts.map(alert => (
              <AlertCard
                key={alert.id}
                title={alert.title}
                description={alert.description}
                metric={alert.metric}
                severity={alert.severity}
                timestamp={`Day ${selectedDay}`}
              />
            ))}
          </section>

          {/* Measurement Source Label */}
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
                value={dayMetrics?.actual || data.measurement.area_cm2}
                unit="cm²"
              />
              <MeasuredMetricsCard
                label="Expected"
                value={dayMetrics?.expected || data.measurement.trajectory.expected[selectedDay - 1]}
                unit="cm²"
                riskLevel="GREEN"
              />
              <MeasuredMetricsCard
                label="Redness"
                value={data.measurement.redness_pct}
                unit="%"
                riskLevel={data.measurement.redness_pct > 15 ? 'AMBER' : 'GREEN'}
              />
              <MeasuredMetricsCard
                label="Exudate"
                value={data.measurement.pus_pct}
                unit="%"
                riskLevel={data.measurement.pus_pct > 5 ? 'RED' : 'GREEN'}
              />
            </div>

            {/* Change Indicator */}
            {dayMetrics && (
              <div style={{ marginTop: spacing.lg }}>
                <ChangeIndicator
                  changes={[
                    {
                      metric: 'Wound Area',
                      value: Math.abs(dayMetrics.changeFromPrev),
                      direction: dayMetrics.direction === 'down' ? 'down' : 'up'
                    }
                  ]}
                  lastCaptureTime={`Day ${selectedDay - 1}`}
                />
              </div>
            )}
          </section>

          {/* Simulation Toggle */}
          <section style={sectionStyle}>
            <SimulationToggle
              enabled={simulationMode}
              onToggle={setSimulationMode}
            />
          </section>

          {/* LAYER B: Simulated Metrics */}
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
                  value={data.simulation?.simulated_area_cm2 || 0}
                  unit="cm²"
                  originalValue={data.measurement.area_cm2}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
