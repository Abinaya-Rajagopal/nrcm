"""
Metrics Service

Heuristic metric extraction (area, redness, exudate) using OpenCV + NumPy.
Deterministic, stateless functions aligned with locked API contract.

DEMO_MODE returns stable mock values without running image processing.
"""

from typing import Dict, Any, Tuple
import numpy as np
import cv2

from ..config import (
    DEMO_MODE,
    PIXELS_PER_CM2,
    RED_HUE_LOW_1,
    RED_HUE_HIGH_1,
    RED_HUE_LOW_2,
    RED_HUE_HIGH_2,
    RED_SAT_MIN,
    PUS_SAT_MAX,
    PUS_VAL_MIN,
)

def _round_1(x: float) -> float:
    """Round to 1 decimal place deterministically."""
    return round(float(x), 1)


def _clamp_pct(x: float) -> float:
    """Clamp percentage to [0, 100]."""
    return float(max(0.0, min(100.0, x)))


def calculate_wound_area(mask: np.ndarray) -> float:
    """
    Estimate wound area (cm²) by counting non-zero mask pixels and
    converting via fixed calibration constant.
    """
    if mask is None or mask.size == 0:
        return 0.0
    # Treat any non-zero pixel as part of the wound
    wound_pixels = int(np.count_nonzero(mask))
    area_cm2 = wound_pixels / float(PIXELS_PER_CM2)
    return _round_1(area_cm2)


def calculate_redness(image_bgr: np.ndarray, peri_wound_mask: np.ndarray) -> float:
    """
    Compute redness percentage within peri-wound region using HSV heuristics.
    """
    if (
        image_bgr is None
        or peri_wound_mask is None
        or peri_wound_mask.size == 0
    ):
        return 0.0

    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    h = hsv[:, :, 0]
    s = hsv[:, :, 1]

    # Binary mask of peri-wound region (non-zero indicates region of interest)
    roi = peri_wound_mask > 0
    total_roi = int(np.count_nonzero(roi))
    if total_roi == 0:
        return 0.0

    # Red hue intervals in OpenCV HSV (H in [0,179])
    red_range1 = (h >= RED_HUE_LOW_1) & (h <= RED_HUE_HIGH_1)
    red_range2 = (h >= RED_HUE_LOW_2) & (h <= RED_HUE_HIGH_2)
    sat_ok = s >= RED_SAT_MIN  # Require sufficient saturation

    red_pixels = int(np.count_nonzero(((red_range1 | red_range2) & sat_ok) & roi))
    redness_pct = (red_pixels / total_roi) * 100.0
    return _round_1(_clamp_pct(redness_pct))


def calculate_exudate(image_bgr: np.ndarray, wound_mask: np.ndarray) -> float:
    """
    Compute pus/exudate percentage within wound region using HSV heuristics.
    """
    if (
        image_bgr is None
        or wound_mask is None
        or wound_mask.size == 0
    ):
        return 0.0

    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    s = hsv[:, :, 1]
    v = hsv[:, :, 2]

    roi = wound_mask > 0
    total_roi = int(np.count_nonzero(roi))
    if total_roi == 0:
        return 0.0

    low_sat = s <= PUS_SAT_MAX
    high_val = v >= PUS_VAL_MIN
    pus_pixels = int(np.count_nonzero((low_sat & high_val) & roi))
    pus_pct = (pus_pixels / total_roi) * 100.0
    return _round_1(_clamp_pct(pus_pct))


def get_debug_metrics(
    image_rgb: np.ndarray, 
    wound_mask: np.ndarray, 
    peri_wound_mask: np.ndarray
) -> Dict[str, Any]:
    """
    Extract comprehensive metrics and raw data for debugging.
    Note: Internal functions expect BGR, so we convert RGB to BGR here.
    """
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    
    area = calculate_wound_area(wound_mask)
    redness = calculate_redness(image_bgr, peri_wound_mask)
    exudate = calculate_exudate(image_bgr, wound_mask)
    
    return {
        "area_cm2": area,
        "redness_pct": redness,
        "pus_pct": exudate,
        "pixel_counts": {
            "wound": int(np.sum(wound_mask > 0)),
            "peri_wound": int(np.sum(peri_wound_mask > 0)),
            "total_image": int(image_rgb.shape[0] * image_rgb.shape[1])
        },
        "hsv_thresholds": {
            "red_hue": [[RED_HUE_LOW_1, RED_HUE_HIGH_1], [RED_HUE_LOW_2, RED_HUE_HIGH_2]],
            "red_sat_min": RED_SAT_MIN,
            "pus_sat_max": PUS_SAT_MAX,
            "pus_val_min": PUS_VAL_MIN
        }
    }


def compute_metrics(
    image_bgr: np.ndarray,
    wound_mask: np.ndarray,
    peri_wound_mask: np.ndarray,
    segmentation_mode: str = "unknown"
) -> Dict[str, Any]:
    """
    Compute all metrics, honoring DEMO_MODE by returning mock values
    without running image processing when enabled.
    """
    if DEMO_MODE:
        return {
            "area_cm2": 12.4,
            "redness_pct": 18.2,
            "pus_pct": 4.1,
            "segmentation_mode": "mock",
            "area_reliable": False
        }

    area_cm2 = calculate_wound_area(wound_mask)
    redness_pct = calculate_redness(image_bgr, peri_wound_mask)
    pus_pct = calculate_exudate(image_bgr, wound_mask)

    return {
        "area_cm2": area_cm2,
        "redness_pct": redness_pct,
        "pus_pct": pus_pct,
        "segmentation_mode": segmentation_mode,
        "area_reliable": (segmentation_mode == "model")
    }


def calculate_metrics(segmentation_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrate metric calculation based on segmentation result.
    """
    # Note: Backend might provide image_rgb or image_bgr.
    # The new pipeline uses image_rgb for consistency at the top level.
    # But internal cv2 logic here uses BGR.
    image = segmentation_result.get("image_bgr")
    if image is None:
        image_rgb = segmentation_result.get("image_rgb")
        if image_rgb is not None:
            image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
            
    wound_mask = segmentation_result.get("wound_mask")
    peri_wound_mask = segmentation_result.get("peri_wound_mask")
    segmentation_mode = segmentation_result.get("segmentation_mode", "unknown")

    return compute_metrics(image, wound_mask, peri_wound_mask, segmentation_mode)


def get_mock_metrics() -> Dict[str, Any]:
    """Stable mock metrics for demo mode."""
    return {
        "area_cm2": 12.4,
        "redness_pct": 18.2,
        "pus_pct": 4.1,
        "method": "mock"
    }
