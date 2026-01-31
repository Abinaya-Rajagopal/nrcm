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
export interface TrajectoryData {
  expected: number[];
  actual: number[];
}

export interface AnalyzeResponse {
  area_cm2: number;
  redness_pct: number;
  pus_pct: number;
  risk_level: 'GREEN' | 'AMBER' | 'RED';
  trajectory: TrajectoryData;
  alert_reason: string | null;
}

export interface AnalyzeRequest {
  image_base64?: string;
  use_demo_image?: boolean;
}

/**
 * Demo/Mock data for frontend development and fallback
 */
const DEMO_RESPONSE: AnalyzeResponse = {
  area_cm2: 4.2,
  redness_pct: 12.5,
  pus_pct: 3.2,
  risk_level: 'AMBER',
  trajectory: {
    expected: [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0],
    actual: [5.0, 4.7, 4.3, 4.0, 3.8, 3.5, 4.2],
  },
  alert_reason: 'Wound area reduction is slower than expected trajectory.',
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
