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

  // Simulation state - OFF by default (Layer B hidden)
  const [simulationMode, setSimulationMode] = useState(false);

  // Timeline state
  const [selectedDay, setSelectedDay] = useState(5); // Default to latest day

  useEffect(() => {
    fetchData();
  }, [simulationMode]);

  // Image upload state
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        fetchData(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async (customImageBase64?: string) => {
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
        requestData.use_demo_image = true;
      }

      const response = await analyzeWound(requestData);
      setData(response);
      
      // Reset selected day to latest when data loads
      if (response?.measurement?.trajectory?.actual?.length) {
        setSelectedDay(response.measurement.trajectory.actual.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // ... (existing computed values) ...

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
              beforeImage={BEFORE_IMAGE}
              afterImage={AFTER_IMAGE}
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
