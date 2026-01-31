"""
Metrics Service

Heuristic metric extraction (area, redness, exudate) using OpenCV + NumPy.
Deterministic, stateless functions aligned with locked API contract.

DEMO_MODE returns stable mock values without running image processing.
"""

from typing import Dict, Any

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


def get_mock_metrics() -> Dict[str, Any]:
    """Stable mock metrics for demo mode and frontend expectations."""
    return {
        "area_cm2": 12.4,
        "redness_pct": 18.2,
        "pus_pct": 4.1,
        "method": "mock",
        "note": "Real metric extraction not yet implemented"
    }


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

    Threshold rationale: use a fixed PIXELS_PER_CM2 to stay deterministic
    and avoid camera metadata or scaling.
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

    Heuristic: red hue lies in two HSV ranges due to circular hue space.
    Require minimum saturation to avoid counting pale skin as red.
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

    Heuristic: low saturation and high value highlight whitish/yellowish regions
    typical of exudate. This is NOT infection detection.
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


def compute_metrics(
    image_bgr: np.ndarray,
    wound_mask: np.ndarray,
    peri_wound_mask: np.ndarray,
    segmentation_mode: str = "unknown"
) -> Dict[str, Any]:
    """
    Compute all metrics, honoring DEMO_MODE by returning mock values
    without running image processing when enabled.
    
    Includes metadata about segmentation reliability.
    """
    if DEMO_MODE:
        return {
            "area_cm2": 12.4,
            "redness_pct": 18.2,
            "pus_pct": 4.1,
            "segmentation_mode": "mock",
            "area_reliable": False
        }

    # Defensive checks (Person 3 validation)
    if image_bgr is None:
        raise ValueError("compute_metrics: image_bgr cannot be None")
    if wound_mask is None:
        raise ValueError("compute_metrics: wound_mask cannot be None")
    if peri_wound_mask is None:
        raise ValueError("compute_metrics: peri_wound_mask cannot be None")

    if image_bgr.ndim != 3:
        # Some OpenCV versions might load grayscale as 2D, but we expect BGR
        raise ValueError(f"compute_metrics: image_bgr must be 3-channel (H, W, 3), got {image_bgr.shape}")
    
    h, w = image_bgr.shape[:2]

    if wound_mask.shape != (h, w):
        raise ValueError(f"compute_metrics: wound_mask shape {wound_mask.shape} does not match image {(h, w)}")
    
    if peri_wound_mask.shape != (h, w):
        raise ValueError(f"compute_metrics: peri_wound_mask shape {peri_wound_mask.shape} does not match image {(h, w)}")

    area_cm2 = calculate_wound_area(wound_mask)
    redness_pct = calculate_redness(image_bgr, peri_wound_mask)
    pus_pct = calculate_exudate(image_bgr, wound_mask)

    # Identical area values are acceptable if segmentation_mode == "fallback"
    # because the fallback mask is a fixed-radius circle.

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
    Adapter for integration with backend orchestration (Person 1).
    
    Args:
        segmentation_result: Output from segmentation service containing
                             image_bgr, wound_mask, peri_wound_mask,
                             and optional segmentation_mode
    
    Returns:
        Dict containing area_cm2, redness_pct, pus_pct, and metadata
    """
    image = segmentation_result.get("image_bgr")
    wound_mask = segmentation_result.get("wound_mask")
    peri_wound_mask = segmentation_result.get("peri_wound_mask")
    segmentation_mode = segmentation_result.get("segmentation_mode", "unknown")

    return compute_metrics(image, wound_mask, peri_wound_mask, segmentation_mode)
