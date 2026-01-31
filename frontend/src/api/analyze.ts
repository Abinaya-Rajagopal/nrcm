/**
 * API Types and Client for /analyze endpoint
 * 
 * ⚠️ These types match the locked API contract.
 * Do not modify without team coordination.
 * 
 * DEMO MODE: Falls back to mock data if backend is unavailable.
 */

import { API_ENDPOINTS, config } from '../config';

// Response Types (matching backend schema)
// Response Types (matching backend schema)
export interface TrajectoryData {
  expected: number[];
  actual: number[];
}

export interface MeasurementData {
  area_cm2: number;
  redness_pct: number;
  pus_pct: number;
  risk_level: 'GREEN' | 'AMBER' | 'RED';
  trajectory: TrajectoryData;
  alert_reason: string | null;
  deviation_cm2: number;
  image_url?: string;
}

export interface SimulationData {
  enabled: boolean;
  assumptions_used: string[];
  simulated_area_cm2: number;
  reference_curve: number[];
  extrapolated_curve: number[];
  completion_window_days: [number, number];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AnalyzeResponse {
  measurement: MeasurementData;
  simulation: SimulationData | null;
  limitations: string[];
  flags: {
    demo_mode: boolean;
    fallback_segmentation: boolean;
    research_mode: boolean;
  };
  metadata: {
    analysis_id: string;
    captured_at: string;
    observation_count: number;
  };
}

export interface PatientMetadata {
  is_smoker: boolean;
  has_diabetes: boolean;
  age?: number;
  surgery_type?: string;
  has_reference_object: boolean;
}

export interface AnalyzeRequest {
  image_base64?: string;
  use_demo_image?: boolean;
  enable_simulation?: boolean;
  metadata?: PatientMetadata;
}

/**
 * Demo/Mock data for frontend development and fallback
 */
const DEMO_RESPONSE: AnalyzeResponse = {
  measurement: {
    area_cm2: 4.2,
    redness_pct: 12.5,
    pus_pct: 3.2,
    risk_level: 'AMBER',
    trajectory: {
      expected: [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0],
      actual: [5.0, 4.7, 4.3, 4.0, 3.8, 3.5, 4.2],
    },
    alert_reason: 'Wound area reduction is slower than expected trajectory.',
    deviation_cm2: 0.7
  },
  simulation: {
    enabled: true,
    assumptions_used: ['Smoking adjustment', 'Diabetes adjustment'],
    simulated_area_cm2: 4.1,
    reference_curve: [5.0, 4.4, 3.8, 3.2, 2.6, 2.0, 1.4],
    extrapolated_curve: [5.0, 4.4, 3.8, 3.2, 2.6, 2.0, 1.4, 0.8],
    completion_window_days: [12, 18],
    confidence: 'LOW'
  },
  limitations: [
    "Single-image analysis per capture",
    "Simulation outputs have LOW confidence"
  ],
  flags: {
    demo_mode: true,
    fallback_segmentation: true,
    research_mode: true
  },
  metadata: {
    analysis_id: "demo-id",
    captured_at: new Date().toISOString(),
    observation_count: 7
  }
};

/**
 * Call the /analyze endpoint
 * 
 * Falls back to demo data if:
 * - DEMO_MODE is enabled in config
 * - Backend is unreachable
 * 
 * @param request - Optional request parameters
 * @returns AnalyzeResponse with wound metrics
 */
export async function analyzeWound(request?: AnalyzeRequest): Promise<AnalyzeResponse> {
  // If demo mode is enabled, return mock data directly
  if (config.DEMO_MODE) {
    console.log('[API] Demo mode enabled - using mock data');
    // Simulate network delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 800));
    return DEMO_RESPONSE;
  }

  try {
    const response = await fetch(API_ENDPOINTS.analyze, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request || { use_demo_image: true }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // Fallback to demo data if backend is unreachable
    console.warn('[API] Backend unreachable, falling back to demo data:', error);
    return DEMO_RESPONSE;
  }
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<{ status: string; demo_mode: boolean }> {
  if (config.DEMO_MODE) {
    return { status: 'ok', demo_mode: true };
  }

  try {
    const response = await fetch(API_ENDPOINTS.health);
    return response.json();
  } catch {
    return { status: 'ok', demo_mode: true };
  }
}
