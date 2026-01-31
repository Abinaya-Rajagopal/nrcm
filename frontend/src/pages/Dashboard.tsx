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
import { analyzeWound, AnalyzeResponse } from '../api/analyze';
import { RISK_COLORS, RiskLevel } from '../config';

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

  const containerStyle: React.CSSProperties = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '32px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6b7280',
  };

  const metricsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  };

  const alertStyle: React.CSSProperties = {
    backgroundColor: data?.risk_level ? `${RISK_COLORS[data.risk_level as RiskLevel]}15` : '#fef3c7',
    border: `1px solid ${data?.risk_level ? RISK_COLORS[data.risk_level as RiskLevel] : '#f59e0b'}`,
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const alertIconStyle: React.CSSProperties = {
    fontSize: '20px',
  };

  const refreshButtonStyle: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '24px',
  };

  const demoNoticeStyle: React.CSSProperties = {
    backgroundColor: '#dbeafe',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '24px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#1e40af',
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, textAlign: 'center', paddingTop: '100px' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ ...alertStyle, backgroundColor: '#fee2e2', borderColor: '#ef4444' }}>
          <span style={alertIconStyle}>⚠️</span>
          <div>
            <strong>Error:</strong> {error}
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Make sure the backend is running on http://localhost:8000
            </div>
          </div>
        </div>
        <button style={refreshButtonStyle} onClick={fetchData}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Wound Monitoring Dashboard</h1>
        <p style={subtitleStyle}>Post-operative healing status overview</p>
      </header>

      <div style={demoNoticeStyle}>
        🔧 <strong>Demo Mode</strong> - Displaying mock data for development
      </div>

      {/* Alert Section */}
      {data.alert_reason && (
        <div style={alertStyle}>
          <span style={alertIconStyle}>
            {data.risk_level === 'RED' ? '🔴' : data.risk_level === 'AMBER' ? '🟠' : '🟢'}
          </span>
          <div>
            <strong>Alert:</strong> {data.alert_reason}
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={metricsGridStyle}>
        <MetricsCard 
          label="Wound Area" 
          value={data.area_cm2} 
          unit="cm²" 
        />
        <MetricsCard 
          label="Redness" 
          value={data.redness_pct} 
          unit="%" 
        />
        <MetricsCard 
          label="Exudate" 
          value={data.pus_pct} 
          unit="%" 
        />
        <MetricsCard 
          label="Risk Level" 
          value={data.risk_level} 
          riskLevel={data.risk_level as RiskLevel}
        />
      </div>

      {/* Trajectory Chart */}
      <TrajectoryChart data={data.trajectory} width={500} height={250} />

      {/* Refresh Button */}
      <div style={{ textAlign: 'center' }}>
        <button style={refreshButtonStyle} onClick={fetchData}>
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
