/**
 * API Types and Client for /analyze endpoint
 * 
 * ⚠️ These types match the locked API contract.
 * Do not modify without team coordination.
 */

import { API_ENDPOINTS } from '../config';

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
 * Call the /analyze endpoint
 * 
 * @param request - Optional request parameters
 * @returns AnalyzeResponse with wound metrics
 */
export async function analyzeWound(request?: AnalyzeRequest): Promise<AnalyzeResponse> {
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
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<{ status: string; demo_mode: boolean }> {
  const response = await fetch(API_ENDPOINTS.health);
  return response.json();
}
