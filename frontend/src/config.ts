/**
 * Frontend Configuration
 * 
 * DEMO_MODE behavior mirrors the backend setting.
 * API_BASE_URL should point to the backend server.
 */

export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  API_VERSION: 'v1',
  
  // Demo Mode (mirrors backend)
  DEMO_MODE: true,
  
  // Feature Flags
  ENABLE_TRAJECTORY_CHART: true,
  ENABLE_ALERTS: true,
};

// Derived URLs
export const API_ENDPOINTS = {
  analyze: `${config.API_BASE_URL}/api/${config.API_VERSION}/analyze`,
  health: `${config.API_BASE_URL}/health`,
};

// Risk Level Colors
export const RISK_COLORS = {
  GREEN: '#22c55e',
  AMBER: '#f59e0b',
  RED: '#ef4444',
} as const;

export type RiskLevel = keyof typeof RISK_COLORS;
