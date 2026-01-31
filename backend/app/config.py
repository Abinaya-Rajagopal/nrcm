"""
Application Configuration

This module contains all configuration settings for the backend.
DEMO_MODE controls whether the application returns mock data or uses real processing.
"""

# Demo Mode Toggle
# When True: Returns mock/synthetic data for all endpoints
# When False: Uses real processing logic (not yet implemented)
DEMO_MODE = True

# API Settings
API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"

# Demo Asset Paths
DEMO_IMAGES_PRIMARY = "demo_assets/wound_images/primary"
DEMO_IMAGES_FALLBACK = "demo_assets/wound_images/fallback"

# Risk Level Thresholds (heuristic, not diagnostic)
RISK_THRESHOLDS = {
    "GREEN": {"area_change_pct": -5, "redness_max": 15, "pus_max": 2},
    "AMBER": {"area_change_pct": 0, "redness_max": 25, "pus_max": 8},
    "RED": {"area_change_pct": 5, "redness_max": 100, "pus_max": 100},
}
