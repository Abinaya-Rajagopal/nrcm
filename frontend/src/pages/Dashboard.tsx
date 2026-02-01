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
import { SimulationInputsPanel, HealingWindow } from '../components/LayerB';

// Shared Components
import { TrajectoryChart } from '../components/TrajectoryChart';
import { ComparisonSlider } from '../components/ComparisonSlider';
import { WarningBanner } from '../components/WarningBanner';
import { ViewModeToggle, type ViewMode } from '../components/ViewModeToggle';
import { MeasurementLabel } from '../components/MeasurementLabel';
import { PatientStatusCard } from '../components/PatientStatusCard';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { AlertCard } from '../components/AlertCard';
import { LoadingSkeleton, MetricSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';
import { TrendIndicator } from '../components/TrendIndicator';

import { config } from '../config';

// API & Data
import { 
  analyzeWound, 
  analyzeWoundDebug, 
  type AnalyzeResponse, 
  type DebugAnalyzeResponse,
  type PatientMetadata 
} from '../api/analyze';
import { VisualExplanation } from '../components/VisualExplanation';
import { calculateMetricsForDay } from '../utils/metricLogic';
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
  const [debugData, setDebugData] = useState<DebugAnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('clinician');

  // Timeline state
  const [selectedDay, setSelectedDay] = useState(1); // Default to Day 1 initially
  const [observations, setObservations] = useState<{ 
    day: number; 
    img: string;
    isDemo: boolean;
    metrics?: AnalyzeResponse['measurement']; 
  }[]>([]);

  // Simulation state - OFF by default (Layer B hidden)
  const [simulationMode] = useState(false);
  
  // Session State
  const generateNewSessionId = () => {
    const newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    localStorage.setItem('wound_session_id', newId);
    return newId;
  };

  const [sessionId, setSessionId] = useState(() => {
    const stored = localStorage.getItem('wound_session_id');
    if (stored) return stored;
    return generateNewSessionId();
  });

  // Onboarding State
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [patientMetadata, setPatientMetadata] = useState<PatientMetadata>({
    is_smoker: false,
    has_diabetes: false,
    has_reference_object: false
  });
  
  // Temp state for onboarding form
  const [tempMetadata, setTempMetadata] = useState<PatientMetadata>({
    is_smoker: false,
    has_diabetes: false,
    has_reference_object: false
  });

  // Upload UI State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputGalleryRef = React.useRef<HTMLInputElement>(null);
  const fileInputCameraRef = React.useRef<HTMLInputElement>(null);

  // Fetch initial data on load
  useEffect(() => {
    fetchData();
  }, [simulationMode, viewMode]);

  // Camera State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Manage Camera Lifecycle
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (showCameraModal) {
        // Guard: Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           setError("Camera API not supported in this browser");
           setShowCameraModal(false);
           return;
        }

        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setStream(currentStream);
          if (videoRef.current) {
            videoRef.current.srcObject = currentStream;
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setError("Unable to access camera. Please check permissions.");
          setShowCameraModal(false);
        }
      }
    };

    if (showCameraModal) {
      startCamera();
    }

    // Cleanup function: Stops camera when modal closes OR component unmounts
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
    };
  }, [showCameraModal]);

  const handleCameraCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Match canvas size to video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            processUpload(file);
            setShowCameraModal(false);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleOnboardingSubmit = (skipped: boolean) => {
    if (!skipped) {
      setPatientMetadata(tempMetadata);
    }
    setOnboardingComplete(true);
  };

  const processUpload = (file: File) => {
    setShowUploadModal(false); // Close modal if open
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      // REMOVE DEMO DATA on first real upload
      let realObservations = observations.filter(o => !o.isDemo);
      
      // RESET SESSION ON FIRST UPLOAD
      // If this is the first image the user is manually adding (realObservations is empty), start a fresh session.
      let activeSessionId = sessionId;
      let newDayIndex = realObservations.length + 1;

      if (realObservations.length === 0) {
           activeSessionId = generateNewSessionId();
           setSessionId(activeSessionId);
           newDayIndex = 1; // It's Day 1 now
      }
      
      // Append new observation locally (optimistic)
      const newObs = { day: newDayIndex, img: base64String, isDemo: false };
      const updatedObs = [...realObservations, newObs];
      
      setObservations(updatedObs);
      setSelectedDay(newDayIndex); // Auto-select latest
      
      // Pass specifically this image for analysis
      fetchData(base64String, updatedObs, activeSessionId);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processUpload(file);
    }
  };

  const fetchData = async (customImageBase64?: string, currentObservations?: { day: number, img: string, isDemo?: boolean }[], activeSessionId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const requestData: any = { 
        enable_simulation: simulationMode,
        session_id: activeSessionId || sessionId,
        metadata: patientMetadata // Pass metadata
      };

      const obsToUse = currentObservations || observations;

      if (customImageBase64) {
        requestData.image_base64 = customImageBase64;
        requestData.use_demo_image = false;
      } else {
        // If no specific image passed, use the latest one from state
        if (obsToUse.length > 0) {
            requestData.image_base64 = obsToUse[obsToUse.length - 1].img;
            requestData.use_demo_image = false;
        } else {
            requestData.use_demo_image = true;
        }
      }

      let response: AnalyzeResponse;
      
      if (viewMode === 'clinician' && !config.DEMO_MODE) {
        const debugResponse = await analyzeWoundDebug(requestData);
        response = debugResponse.results;
        setDebugData(debugResponse);
      } else {
        response = await analyzeWound(requestData);
        setDebugData(null);
      }
      
      setData(response);
      
      // Update the correctly corresponding observation with these metrics
      // This ensures that when we slide back to this day, we show THESE metrics, not the latest ones
      const dayIndex = response.metadata.observation_count;
      
      // If we are in demo mode/initial load and observations is empty, we must populate it from the response
      if (observations.length === 0 && response.flags.demo_mode) {
          const demoObs = {
              day: 1,
              img: response.measurement.image_url || BEFORE_IMAGE, // Use backend URL or fallback
              isDemo: true, // EXPLICITLY MARK AS DEMO
              metrics: response.measurement
          };
          setObservations([demoObs]);
      } else if (dayIndex > 0 && obsToUse.length >= dayIndex) {
         // Create a shallow copy of the observations logic
         setObservations(prevObs => {
            const nextObs = [...prevObs];
            const targetIndex = nextObs.findIndex(o => o.day === dayIndex);
            if (targetIndex !== -1) {
                nextObs[targetIndex] = {
                    ...nextObs[targetIndex],
                    metrics: response.measurement,
                    isDemo: nextObs[targetIndex].isDemo ?? false // Preserve or default
                };
            }
            return nextObs;
         });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMPUTED VALUES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // RULE 2 & 3: Baseline must be first NON-DEMO observation
  const realObservations = observations.filter(o => !o.isDemo);
  const baselineObs = realObservations.length > 0 ? realObservations[0] : null;

  // Resolve Images for Comparison
  // Left is ALWAYS Baseline. Right is Day N (Selected).
  const baselineImage = baselineObs ? baselineObs.img : BEFORE_IMAGE;
  const currentImage = realObservations.length > 0 
    ? (realObservations[selectedDay - 1]?.img || realObservations[realObservations.length - 1].img) 
    : AFTER_IMAGE;
  
  // Get historical metrics if available
  const historicalMetrics = realObservations[selectedDay - 1]?.metrics;
  // Use historical if available, otherwise fallback to latest IF selected day matches latest
  const displayMetrics = historicalMetrics || (selectedDay === data?.metadata.observation_count ? data?.measurement : null);

  // Get metrics for selected day
  const getMetricsForDay = (day: number) => {
    // Safety check: ensure we are not reading from demo data
    // Rule 8: Add a Safety Assertion (Kept here as it relies on component state)
    if (observations.some(o => o.isDemo && realObservations.includes(o))) {
         // This should be impossible due to filtering but is a required assertion
         throw new Error("CRITICAL DATA CORRUPTION: Demo data detected in real metric computation!");
    }

    if (!data?.measurement?.trajectory) return null;

    return calculateMetricsForDay(
        day,
        realObservations.length,
        data.measurement.trajectory.actual,
        data.measurement.trajectory.expected,
        displayMetrics
    );
  };

  const dayMetrics = getMetricsForDay(selectedDay);

  // Generate explanation content based on data
  const getExplanation = () => {
    try {
      // Prefer displayMetrics (historical for selected day) over generic data
      const targetMetrics = displayMetrics || data?.measurement;
      
      if (!targetMetrics) return null;

      const risk = targetMetrics.risk_level as RiskLevel;
      
      // PARANOID SAFETY CHECK: Define raw fallback if imports fail
      const fallbackConfig = {
         label: 'Needs Monitoring',
         color: '#F59E0B'
      };

      // Safely resolve config
      const config = (riskConfig && riskConfig[risk]) 
        ? riskConfig[risk] 
        : (riskConfig && riskConfig['AMBER'] ? riskConfig['AMBER'] : fallbackConfig);

      let status = config.label || 'Unknown';
      let reason = targetMetrics.alert_reason || 'Wound healing is progressing as expected.';
      let logic = '';

      if (risk === 'GREEN') {
        logic = `Risk Assessment: GREEN\n• Wound area: ${targetMetrics.area_cm2.toFixed(1)} cm²\n• Redness: ${targetMetrics.redness_pct.toFixed(1)}%\n• Exudate: ${targetMetrics.pus_pct.toFixed(1)}%`;
      } else if (risk === 'AMBER') {
        logic = `Risk Assessment: AMBER\n• Wound area: ${targetMetrics.area_cm2.toFixed(1)} cm²\n• Trajectory: Slower than expected`;
      } else {
        logic = `Risk Assessment: RED\n• Wound area: ${targetMetrics.area_cm2.toFixed(1)} cm²\n• Critical indicators detected`;
      }

      return { status, reason, logic, riskLevel: risk || 'AMBER' };
    } catch (e) {
      console.error("Critical error in getExplanation:", e);
      return { status: "Error", reason: "Unable to calculate status", logic: "", riskLevel: "AMBER" };
    }
  };

  const explanation = getExplanation();

  // Generate alert cards data
  const getAlerts = () => {
    const targetMetrics = displayMetrics || data?.measurement;
    
    if (!targetMetrics || !dayMetrics) return [];

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
    if (targetMetrics.redness_pct > 15) {
      alerts.push({
        id: 'redness-elevated',
        title: 'Elevated Redness Detected',
        description: `Peri-wound redness is at ${targetMetrics.redness_pct.toFixed(1)}%, which is above the normal threshold of 15%.`,
        metric: {
          label: 'Redness',
          value: targetMetrics.redness_pct,
          unit: '%',
          change: targetMetrics.redness_pct - 15,
          direction: 'up'
        },
        severity: targetMetrics.redness_pct > 25 ? 'RED' : 'AMBER'
      });
    }

    // Check exudate
    if (targetMetrics.pus_pct > 5) {
      alerts.push({
        id: 'exudate-elevated',
        title: 'Exudate Level Elevated',
        description: `Exudate/pus percentage is at ${targetMetrics.pus_pct.toFixed(1)}%, exceeding the 5% threshold.`,
        metric: {
          label: 'Exudate',
          value: targetMetrics.pus_pct,
          unit: '%',
          change: targetMetrics.pus_pct - 5,
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
        {observations.length > 1 && (
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
        )}

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
       {/* ONBOARDING MODAL */}
       {!onboardingComplete && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.md
        }}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '16px',
            padding: spacing['2xl'],
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          }}>
            <h2 style={{ fontSize: typography['2xl'], fontWeight: typography.bold, marginBottom: spacing.sm, color: colors.gray900 }}>
              Welcome to Wound Monitor
            </h2>
            <p style={{ color: colors.gray600, marginBottom: spacing.xl }}>
              Optional: Providing basic health context helps us tailor educational information. This data stays local.
            </p>

            <div style={{ display: 'grid', gap: spacing.lg, marginBottom: spacing['2xl'] }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.md, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={tempMetadata.has_diabetes}
                  onChange={(e) => setTempMetadata({...tempMetadata, has_diabetes: e.target.checked})}
                  style={{ width: '20px', height: '20px', accentColor: colors.blue500 }}
                />
                <span style={{ fontSize: typography.lg, color: colors.gray800 }}>I have diabetes</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.md, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={tempMetadata.is_smoker}
                  onChange={(e) => setTempMetadata({...tempMetadata, is_smoker: e.target.checked})}
                  style={{ width: '20px', height: '20px', accentColor: colors.blue500 }}
                />
                <span style={{ fontSize: typography.lg, color: colors.gray800 }}>I am a smoker</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                <span style={{ fontSize: typography.sm, color: colors.gray600 }}>Age (Optional)</span>
                <input 
                  type="number" 
                  placeholder="Enter your age"
                  value={tempMetadata.age || ''}
                  onChange={(e) => setTempMetadata({...tempMetadata, age: parseInt(e.target.value) || undefined})}
                  style={{ 
                    padding: spacing.md, 
                    borderRadius: '8px', 
                    border: `1px solid ${colors.gray300}`,
                    fontSize: typography.base
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: spacing.md }}>
              <button 
                onClick={() => handleOnboardingSubmit(false)}
                style={{
                  flex: 1,
                  padding: spacing.lg,
                  background: colors.blue600,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: typography.base,
                  fontWeight: typography.semibold,
                  cursor: 'pointer'
                }}
              >
                Save Context
              </button>
              <button 
                onClick={() => handleOnboardingSubmit(true)}
                style={{
                  flex: 1,
                  padding: spacing.lg,
                  background: 'transparent',
                  color: colors.gray600,
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: '10px',
                  fontSize: typography.base,
                  fontWeight: typography.medium,
                  cursor: 'pointer'
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

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
              ref={fileInputGalleryRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={fileInputCameraRef}
              onChange={handleImageUpload}
              accept="image/*"
              capture="environment" // Forces camera on mobile
              style={{ display: 'none' }}
            />
            
            <button style={refreshButtonStyle} onClick={() => setShowUploadModal(true)}>
              <span>📷</span>
              <span>Add Observation</span>
            </button>
          </div>
        </div>
      </header>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.md
        }} onClick={() => setShowUploadModal(false)}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '16px',
            padding: spacing['2xl'],
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: typography.xl, fontWeight: typography.bold, marginBottom: spacing.lg }}>
              Add Wound Observation
            </h3>
            <div style={{ display: 'grid', gap: spacing.md }}>
              <button 
                onClick={() => setShowCameraModal(true)}
                style={{
                  ...refreshButtonStyle,
                  width: '100%', 
                  justifyContent: 'center',
                  background: colors.blue600,
                  fontSize: typography.lg,
                  height: '60px'
                }}
              >
                📸 Take Photo
              </button>
              <button 
                onClick={() => fileInputGalleryRef.current?.click()}
                style={{
                  ...refreshButtonStyle,
                  width: '100%', 
                  justifyContent: 'center',
                  background: colors.white,
                  color: colors.gray800,
                  border: `2px solid ${colors.gray200}`,
                  fontSize: typography.lg,
                  height: '60px'
                }}
              >
                🖼️ Upload from Gallery
              </button>
            </div>
            <button 
              onClick={() => setShowUploadModal(false)}
              style={{
                marginTop: spacing.lg,
                background: 'none',
                border: 'none',
                color: colors.gray500,
                fontSize: typography.sm,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CAMERA MODAL */}
      {showCameraModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.md
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '640px',
            backgroundColor: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: spacing.lg,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              display: 'flex',
              justifyContent: 'center',
              gap: spacing['2xl']
            }}>
               <button
                 onClick={() => setShowCameraModal(false)}
                 style={{
                   background: 'rgba(255, 255, 255, 0.2)',
                   color: '#fff',
                   border: 'none',
                   borderRadius: '50px',
                   padding: '12px 24px',
                   fontSize: typography.base,
                   fontWeight: typography.bold,
                   cursor: 'pointer',
                   backdropFilter: 'blur(4px)'
                 }}
               >
                 Cancel
               </button>
               <button
                 onClick={handleCameraCapture}
                 style={{
                   width: '72px',
                   height: '72px',
                   borderRadius: '50%',
                   background: '#fff',
                   border: '4px solid rgba(255,255,255,0.3)',
                   cursor: 'pointer',
                   boxShadow: '0 0 20px rgba(255,255,255,0.4)'
                 }}
                 aria-label="Capture Photo"
               />
            </div>
          </div>
        </div>
      )}

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
          {observations.length > 1 && (
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
          )}

          {/* VISUAL EXPLANATION OVERLAYS (Clinician Only) */}
          {viewMode === 'clinician' && !data.flags.demo_mode && (
            <VisualExplanation
              originalImage={currentImage}
              segmentation={debugData?.segmentation || null}
              heatmaps={debugData?.heatmaps || null}
              isVisible={viewMode === 'clinician'}
            />
          )}

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
            <RiskBadge level={(explanation?.riskLevel || data.measurement.risk_level) as RiskLevel} size="lg" />
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
                value={dayMetrics?.actual || (displayMetrics?.area_cm2 ?? data.measurement.area_cm2)}
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
                value={displayMetrics?.redness_pct ?? data.measurement.redness_pct}
                unit="%"
                riskLevel={(displayMetrics?.redness_pct ?? data.measurement.redness_pct) > 15 ? 'AMBER' : 'GREEN'}
              />
              <MeasuredMetricsCard
                label="Exudate"
                value={displayMetrics?.pus_pct ?? data.measurement.pus_pct}
                unit="%"
                riskLevel={(displayMetrics?.pus_pct ?? data.measurement.pus_pct) > 5 ? 'RED' : 'GREEN'}
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

           {/* NEW: Contextual Information Panel */}
           <section style={{ 
             marginTop: spacing['2xl'], 
             padding: spacing.lg, 
             backgroundColor: colors.gray50, 
             borderRadius: '12px',
             border: `1px solid ${colors.gray200}`
           }}>
             <h3 style={{ fontSize: typography.sm, fontWeight: typography.bold, color: colors.gray700, marginBottom: spacing.sm, textTransform: 'uppercase' }}>
               ℹ️ Contextual Information
             </h3>
             <p style={{ fontSize: typography.sm, color: colors.gray600, lineHeight: 1.5, marginBottom: spacing.sm }}>
               Healing trends can vary across individuals. This contextual information is shown for interpretation only and does not affect the measured results above.
             </p>
             {(patientMetadata && (patientMetadata.has_diabetes || patientMetadata.is_smoker)) && (
                <p style={{ fontSize: typography.sm, color: colors.gray600, lineHeight: 1.5 }}>
                  Some conditions are associated with slower healing trends on average. Measured wound changes remain the primary indicator in this system.
                </p>
             )}
           </section>

        </div>
      </div>
    </div>
  );
};
