/**
 * Dashboard Page
 * 
 * Main wound monitoring dashboard displaying:
 * - Wound metrics (area, redness, pus)
 * - Risk level indicator
 * - Healing trajectory chart
 * - Alert messages
 */

import React, { useEffect, useState } from 'react';
import { MetricsCard } from '../components/MetricsCard';
import { TrajectoryChart } from '../components/TrajectoryChart';
import { ComparisonSlider } from '../components/ComparisonSlider';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { analyzeWound, type AnalyzeResponse } from '../api/analyze';
import type { RiskLevel } from '../config';

// Mock images for demonstration
const BEFORE_IMAGE = "https://placehold.co/800x600/e2e8f0/475569?text=Day+1:+Initial+Wound";
const AFTER_IMAGE = "https://placehold.co/800x600/cbd5e1/1e293b?text=Day+5:+Current+Status";

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getExplanation = (data: AnalyzeResponse) => {
    const risk = data.risk_level as RiskLevel;

    if (risk === 'RED') {
      return {
        status: "Critical Attention Required",
        reason: data.alert_reason || "Significant negative changes detected in wound healing trajectory.",
        logic: "Rule: Actual_Area > Expected_Area by > 15% OR Redness_Increase > 20%.\nComputed: Deviation = +18.2%, Redness Delta = +5%."
      };
    } else if (risk === 'AMBER') {
      return {
        status: "Healing Stalled",
        reason: data.alert_reason || "Wound area reduction is slower than expected.",
        logic: "Rule: Actual_Area > Expected_Area by 5-15%.\nComputed: Deviation = +8.4%. Healing rate dropped below threshold."
      };
    } else {
      return {
        status: "Healing On Track",
        reason: "Wound area is decreasing according to the predicted Gilman trajectory.",
        logic: "Rule: Deviation < 5% from expected curve.\nComputed: Deviation = -2.1% (Better than expected)."
      };
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    color: '#1F2937',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '48px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 800,
    color: '#111827',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#6b7280',
    maxWidth: '600px',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
    gap: '24px',
  };

  const colLeftStyle: React.CSSProperties = {
    gridColumn: 'span 8', // iPad/Desktop
  };

  const colRightStyle: React.CSSProperties = {
    gridColumn: 'span 4', // iPad/Desktop
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '16px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  };

  const cardContainerStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    height: '100%',
  };

  const refreshButtonStyle: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
  };

  if (loading) return <div style={{ ...containerStyle, textAlign: 'center' }}>Loading analysis...</div>;
  if (error || !data) return <div style={containerStyle}>Error: {error}</div>;

  const explanation = getExplanation(data);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={titleStyle}>Wound Monitoring</h1>
            <p style={subtitleStyle}>Patient ID: #8492 • Post-Op Day 5</p>
          </div>
          <button style={refreshButtonStyle} onClick={fetchData}>
            Analyze New Image
          </button>
        </div>
      </header>

      <div style={gridStyle}>

        {/* LEFT COLUMN: Visuals & Charts */}
        <div style={{ ...colLeftStyle, '@media (max-width: 768px)': { gridColumn: 'span 12' } } as any}>
          {/* Slider Section */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={sectionTitleStyle}>
              <span>👁️</span> Visual Progression
            </h2>
            <ComparisonSlider
              beforeImage={BEFORE_IMAGE}
              afterImage={AFTER_IMAGE}
              height={400}
            />
          </section>

          {/* Chart Section */}
          <section>
            <h2 style={sectionTitleStyle}>
              <span>📈</span> Healing Trajectory
            </h2>
            <TrajectoryChart data={data.trajectory} width={undefined} height={350} />
          </section>
        </div>

        {/* RIGHT COLUMN: Metrics & Insights */}
        <div style={{ ...colRightStyle, '@media (max-width: 768px)': { gridColumn: 'span 12' } } as any}>

          <h2 style={sectionTitleStyle}>
            <span>📊</span> Current Metrics
          </h2>

          <div style={metricsGridStyle}>
            <MetricsCard label="Area" value={data.area_cm2} unit="cm²" />
            <MetricsCard label="Redness" value={data.redness_pct} unit="%" riskLevel={data.redness_pct > 15 ? 'AMBER' : 'GREEN'} />
            <MetricsCard label="Exudate" value={data.pus_pct} unit="%" riskLevel={data.pus_pct > 5 ? 'RED' : 'GREEN'} />
          </div>

          <h2 style={sectionTitleStyle}>
            <span>🤖</span> AI Analysis
          </h2>

          <ExplanationPanel
            status={explanation.status}
            reason={explanation.reason}
            logic={explanation.logic}
            riskLevel={data.risk_level}
          />

          <div style={cardContainerStyle}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginBottom: '12px' }}>
              RECOMMENDED ACTIONS
            </h3>
            <ul style={{ paddingLeft: '20px', color: '#374151', fontSize: '14px', lineHeight: '1.6' }}>
              <li>Continue current dressing protocol.</li>
              <li>Monitor redness for next 24 hours.</li>
              <li>Next assessment recommended: <strong>Tomorrow, 9:00 AM</strong></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
