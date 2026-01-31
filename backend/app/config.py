"""
Application Configuration

This module contains all configuration settings for the backend.
DEMO_MODE controls whether the application returns mock data or uses real processing.
"""

# Demo Mode Toggle
# When True: Returns mock/synthetic data for all endpoints
# When False: Uses real processing logic (not yet implemented)
DEMO_MODE = False

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

# ----- Metric Calibration & Thresholds (heuristic only) -----
# Pixel-to-area calibration: number of pixels per square centimeter.
# This is a fixed constant to ensure deterministic area estimates without camera metadata.
PIXELS_PER_CM2 = 120.0

# Redness detection thresholds (OpenCV HSV ranges)
# Hue range for red wraps around HSV [0,179] in OpenCV, so we use two intervals.
RED_HUE_LOW_1 = 0
RED_HUE_HIGH_1 = 10
RED_HUE_LOW_2 = 170
RED_HUE_HIGH_2 = 180
# Minimum saturation to avoid counting pale skin tones as red (0-255 scale)
RED_SAT_MIN = 80

# Pus/exudate detection thresholds (heuristic)
# Low saturation and high value highlight whitish/yellowish regions typical of exudate.
# Saturation/value are in 0-255 scale in OpenCV HSV.
PUS_SAT_MAX = 60
PUS_VAL_MIN = 180
