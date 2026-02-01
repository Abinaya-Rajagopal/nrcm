"""
Heatmap Visualization Service

Provides metric-derived explainable visualizations for wound analysis.

Features:
1. Redness Heatmap - Peri-wound inflammation visualization
2. Exudate Heatmap - Pus/exudate concentration in wound bed
3. Change Heatmap - Day-to-day healing progression

IMPORTANT CONSTRAINTS:
- NO Grad-CAM or ML-based attention
- NO diagnosis or infection detection claims
- All heatmaps are METRIC-DERIVED, not ML-derived
- Heatmaps are NEVER generated for fallback/demo masks
- Output values normalized to [0, 1] or [-1, 1] for change maps

These visualizations explain:
- WHERE inflammation is strongest (redness heatmap)
- WHERE pus is concentrated (exudate heatmap)
- WHERE healing is improving/worsening (change heatmap)
"""

from typing import Optional, Tuple
import numpy as np

# Lazy import for OpenCV
cv2 = None


def _ensure_cv2():
    """Lazy load OpenCV."""
    global cv2
    if cv2 is None:
        import cv2 as _cv2
        cv2 = _cv2
    return cv2


# ============================================================
# FEATURE 1: REDNESS HEATMAP (PERI-WOUND FOCUS)
# ============================================================

def generate_redness_heatmap(
    image_rgb: np.ndarray,
    peri_wound_mask: np.ndarray
) -> np.ndarray:
    """
    Generate redness heatmap for peri-wound region.
    
    Visualizes inflammation concentration around the wound edges.
    Higher values indicate stronger visual redness (inflammation indicator).
    
    Args:
        image_rgb: RGB image as numpy array (H, W, 3), dtype uint8
        peri_wound_mask: Binary mask (H, W) with values {0, 1}, dtype uint8
                         Only peri-wound pixels (mask == 1) are analyzed.
    
    Returns:
        Heatmap as float32 array (H, W), normalized to [0, 1].
        Pixels outside peri_wound_mask are set to 0.
    
    Algorithm:
        1. Convert image to HSV color space
        2. For each pixel in peri-wound region:
           - Compute hue proximity to red (H ≈ 0 or H ≈ 180 in OpenCV)
           - Weight by saturation (more saturated = more confident)
           - Weight by value (extreme dark/light excluded)
        3. Normalize output to [0, 1]
    
    Note:
        This is a METRIC-DERIVED visualization, not ML attention.
        It highlights regions contributing most to the redness percentage metric.
    """
    cv2 = _ensure_cv2()
    
    # Validate inputs
    if image_rgb is None or peri_wound_mask is None:
        return None
    
    if len(image_rgb.shape) != 3 or image_rgb.shape[2] != 3:
        return None
    
    if peri_wound_mask.shape != image_rgb.shape[:2]:
        return None
    
    h, w = image_rgb.shape[:2]
    
    # Initialize output heatmap
    heatmap = np.zeros((h, w), dtype=np.float32)
    
    # Check if mask has any pixels
    mask_pixels = np.sum(peri_wound_mask == 1)
    if mask_pixels == 0:
        return heatmap
    
    # Convert RGB to HSV
    # Note: cv2.cvtColor expects BGR, but we have RGB
    # So we first convert RGB to BGR, then to HSV
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    image_hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    
    # Extract channels (OpenCV HSV: H in [0,179], S in [0,255], V in [0,255])
    h_channel = image_hsv[:, :, 0]
    s_channel = image_hsv[:, :, 1]
    v_channel = image_hsv[:, :, 2]
    
    # Calculate redness intensity
    # Red in HSV: H near 0 or near 180 (wraps around)
    # In OpenCV, H is [0, 179], so red is near 0 or near 179
    
    # Distance to red hue (considering wrap-around)
    # Red is at H=0 (or H=180 in full scale, but OpenCV uses H/2, so H=0 or H≈179)
    dist_to_red_low = h_channel  # Distance to H=0
    dist_to_red_high = 180 - h_channel  # Distance to H=180 (scaled)
    hue_distance = np.minimum(dist_to_red_low, dist_to_red_high)
    
    # Convert distance to proximity (0 = far from red, 1 = exactly red)
    # Use a threshold of ~30 degrees (15 in OpenCV scale) for red range
    red_threshold = 15.0
    hue_proximity = np.clip(1.0 - (hue_distance / red_threshold), 0, 1)
    
    # Saturation weight (highly saturated colors are more "red")
    # Normalize to [0, 1]
    saturation_weight = s_channel / 255.0
    
    # Value weight (exclude very dark or very bright pixels)
    # Skin tones typically in mid-range values
    v_normalized = v_channel / 255.0
    # Favor mid-range brightness (not too dark, not overexposed)
    value_weight = np.clip(4 * v_normalized * (1 - v_normalized), 0, 1)
    
    # Combine factors: redness = hue_proximity * saturation * value_weight
    redness_intensity = hue_proximity * saturation_weight * value_weight
    
    # Apply mask - only keep peri-wound region
    redness_intensity = redness_intensity * (peri_wound_mask == 1).astype(np.float32)
    
    # Normalize to [0, 1] within the masked region
    masked_values = redness_intensity[peri_wound_mask == 1]
    if len(masked_values) > 0 and np.max(masked_values) > 0:
        max_val = np.percentile(masked_values, 99)  # Use 99th percentile to avoid outliers
        if max_val > 0:
            redness_intensity = np.clip(redness_intensity / max_val, 0, 1)
    
    # Ensure zero outside mask
    redness_intensity[peri_wound_mask == 0] = 0
    
    return redness_intensity.astype(np.float32)


# ============================================================
# FEATURE 2: EXUDATE / PUS HEATMAP (WOUND BED ONLY)
# ============================================================

def generate_exudate_heatmap(
    image_rgb: np.ndarray,
    wound_mask: np.ndarray
) -> np.ndarray:
    """
    Generate exudate/pus heatmap for wound bed region.
    
    Visualizes exudate concentration within the wound area.
    Higher values indicate stronger presence of yellow/white exudate colors.
    
    Args:
        image_rgb: RGB image as numpy array (H, W, 3), dtype uint8
        wound_mask: Binary mask (H, W) with values {0, 1}, dtype uint8
                    Only wound pixels (mask == 1) are analyzed.
    
    Returns:
        Heatmap as float32 array (H, W), normalized to [0, 1].
        Pixels outside wound_mask are set to 0.
    
    Algorithm:
        1. Convert image to HSV color space
        2. For each pixel in wound region:
           - Check if hue is in yellow/cream range (H ≈ 20-40)
           - Check if brightness is high (exudate is typically bright)
           - Combine factors into density score
        3. Normalize output to [0, 1]
    
    Note:
        This is a METRIC-DERIVED visualization, not classification.
        It highlights regions contributing most to the exudate percentage metric.
        NO diagnosis is made - this is purely color-based.
    """
    cv2 = _ensure_cv2()
    
    # Validate inputs
    if image_rgb is None or wound_mask is None:
        return None
    
    if len(image_rgb.shape) != 3 or image_rgb.shape[2] != 3:
        return None
    
    if wound_mask.shape != image_rgb.shape[:2]:
        return None
    
    h, w = image_rgb.shape[:2]
    
    # Initialize output heatmap
    heatmap = np.zeros((h, w), dtype=np.float32)
    
    # Check if mask has any pixels
    mask_pixels = np.sum(wound_mask == 1)
    if mask_pixels == 0:
        return heatmap
    
    # Convert RGB to HSV
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    image_hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    
    # Extract channels
    h_channel = image_hsv[:, :, 0]
    s_channel = image_hsv[:, :, 1]
    v_channel = image_hsv[:, :, 2]
    
    # Exudate/pus characteristics:
    # - Yellow to cream color: Hue 15-45 (in OpenCV scale where H is [0,179])
    # - High brightness: V > 150 typically
    # - Moderate to low saturation (pus can be pale yellow to white)
    
    # Hue score: proximity to yellow-cream range (20-40 in OpenCV)
    hue_center = 30.0  # Center of yellow range
    hue_range = 15.0   # Half-width of accepted range
    hue_distance = np.abs(h_channel - hue_center)
    hue_score = np.clip(1.0 - (hue_distance / hue_range), 0, 1)
    
    # Brightness score: exudate is typically bright
    # V threshold around 150 (out of 255)
    v_normalized = v_channel / 255.0
    brightness_threshold = 0.55  # ~140/255
    brightness_score = np.clip((v_normalized - brightness_threshold) / (1.0 - brightness_threshold), 0, 1)
    
    # Saturation: exudate can be lightly saturated (pale yellow) to more saturated
    # Accept saturation from 20-180 (out of 255)
    s_normalized = s_channel / 255.0
    # Favor moderate saturation (not completely desaturated white, not overly vivid)
    saturation_score = np.clip(s_normalized * 3, 0, 1) * np.clip(1.5 - s_normalized, 0, 1)
    
    # Combine scores
    exudate_intensity = hue_score * brightness_score * saturation_score
    
    # Apply mask - only keep wound region
    exudate_intensity = exudate_intensity * (wound_mask == 1).astype(np.float32)
    
    # Normalize to [0, 1] within the masked region
    masked_values = exudate_intensity[wound_mask == 1]
    if len(masked_values) > 0 and np.max(masked_values) > 0:
        max_val = np.percentile(masked_values, 99)
        if max_val > 0:
            exudate_intensity = np.clip(exudate_intensity / max_val, 0, 1)
    
    # Ensure zero outside mask
    exudate_intensity[wound_mask == 0] = 0
    
    return exudate_intensity.astype(np.float32)


# ============================================================
# FEATURE 3: CHANGE HEATMAP (DAY-TO-DAY PROGRESSION)
# ============================================================

def generate_change_heatmap(
    redness_map_day_n: np.ndarray,
    redness_map_day_n1: np.ndarray,
    combined_mask: np.ndarray
) -> np.ndarray:
    """
    Generate change heatmap showing healing progression between two days.
    
    Visualizes spatial differences in redness between consecutive observations.
    
    Args:
        redness_map_day_n: Redness heatmap from day N (earlier), float32 (H, W)
        redness_map_day_n1: Redness heatmap from day N+1 (later), float32 (H, W)
        combined_mask: Binary mask (H, W) covering wound + peri-wound region
                       Only pixels where mask == 1 are analyzed.
    
    Returns:
        Change heatmap as float32 array (H, W), normalized to [-1, 1].
        - Negative values (toward -1): IMPROVEMENT (redness decreased)
        - Positive values (toward +1): WORSENING (redness increased)
        - Zero: No change
        Pixels outside combined_mask are set to 0.
    
    Algorithm:
        1. Compute delta = redness_day_n1 - redness_day_n
        2. Restrict to wound + peri-wound region
        3. Normalize to [-1, 1]
    
    Note:
        This assumes images are roughly aligned (same wound position).
        This is a METRIC-DERIVED visualization showing progression trends.
    """
    # Validate inputs
    if redness_map_day_n is None or redness_map_day_n1 is None or combined_mask is None:
        return None
    
    if redness_map_day_n.shape != redness_map_day_n1.shape:
        return None
    
    if combined_mask.shape != redness_map_day_n.shape:
        return None
    
    h, w = redness_map_day_n.shape
    
    # Compute delta: positive = worsening, negative = improvement
    delta = redness_map_day_n1.astype(np.float32) - redness_map_day_n.astype(np.float32)
    
    # Apply mask
    delta = delta * (combined_mask == 1).astype(np.float32)
    
    # Check if mask has any pixels
    mask_pixels = np.sum(combined_mask == 1)
    if mask_pixels == 0:
        return np.zeros((h, w), dtype=np.float32)
    
    # Normalize to [-1, 1] within masked region
    masked_delta = delta[combined_mask == 1]
    if len(masked_delta) > 0:
        max_abs = np.percentile(np.abs(masked_delta), 99)
        if max_abs > 0:
            delta = np.clip(delta / max_abs, -1, 1)
    
    # Ensure zero outside mask
    delta[combined_mask == 0] = 0
    
    return delta.astype(np.float32)


# ============================================================
# VISUALIZATION UTILITIES
# ============================================================

def apply_heatmap_overlay(
    image_rgb: np.ndarray,
    heatmap: np.ndarray,
    colormap: str = "jet",
    alpha: float = 0.5,
    mask: Optional[np.ndarray] = None
) -> np.ndarray:
    """
    Apply heatmap overlay to image for visualization.
    
    Args:
        image_rgb: Original RGB image (H, W, 3), dtype uint8
        heatmap: Heatmap values (H, W), float32 in [0, 1]
        colormap: OpenCV colormap name ("jet", "hot", "rainbow")
        alpha: Blend factor (0 = image only, 1 = heatmap only)
        mask: Optional mask to restrict overlay region
    
    Returns:
        RGB image with heatmap overlay (H, W, 3), dtype uint8
    
    Color scales:
        - "jet": Blue (low) -> Yellow -> Red (high) - general purpose
        - "hot": Black -> Red -> Yellow -> White - for intensity
        - "inferno": Black -> Purple -> Red -> Yellow - perceptually uniform
    """
    cv2 = _ensure_cv2()
    
    if image_rgb is None or heatmap is None:
        return image_rgb
    
    # Ensure heatmap is in range [0, 255] for colormap
    heatmap_uint8 = (np.clip(heatmap, 0, 1) * 255).astype(np.uint8)
    
    # Select colormap
    colormap_dict = {
        "jet": cv2.COLORMAP_JET,
        "hot": cv2.COLORMAP_HOT,
        "rainbow": cv2.COLORMAP_RAINBOW,
        "inferno": cv2.COLORMAP_INFERNO,
        "viridis": cv2.COLORMAP_VIRIDIS,
    }
    cv_colormap = colormap_dict.get(colormap, cv2.COLORMAP_JET)
    
    # Apply colormap (returns BGR)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv_colormap)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    # Create blend
    overlay = image_rgb.copy().astype(np.float32)
    heatmap_float = heatmap_colored_rgb.astype(np.float32)
    
    if mask is not None:
        # Only blend within mask
        mask_3d = np.expand_dims(mask == 1, axis=2).astype(np.float32)
        blended = overlay * (1 - alpha * mask_3d) + heatmap_float * alpha * mask_3d
    else:
        # Blend only where heatmap > 0
        heatmap_presence = np.expand_dims(heatmap > 0, axis=2).astype(np.float32)
        blended = overlay * (1 - alpha * heatmap_presence) + heatmap_float * alpha * heatmap_presence
    
    return np.clip(blended, 0, 255).astype(np.uint8)


def apply_change_heatmap_overlay(
    image_rgb: np.ndarray,
    change_heatmap: np.ndarray,
    alpha: float = 0.5,
    mask: Optional[np.ndarray] = None
) -> np.ndarray:
    """
    Apply change heatmap overlay with green (improvement) / red (worsening) colors.
    
    Args:
        image_rgb: Original RGB image (H, W, 3), dtype uint8
        change_heatmap: Change values (H, W), float32 in [-1, 1]
                        Negative = improvement, Positive = worsening
        alpha: Blend factor (0 = image only, 1 = heatmap only)
        mask: Optional mask to restrict overlay region
    
    Returns:
        RGB image with change heatmap overlay (H, W, 3), dtype uint8
        - Green tint: Improvement (healing)
        - Red tint: Worsening (stalled/regression)
    """
    if image_rgb is None or change_heatmap is None:
        return image_rgb
    
    h, w = change_heatmap.shape
    
    # Create RGB heatmap
    heatmap_rgb = np.zeros((h, w, 3), dtype=np.float32)
    
    # Improvement (negative values) -> Green
    improvement = np.clip(-change_heatmap, 0, 1)
    heatmap_rgb[:, :, 1] = improvement * 255  # Green channel
    
    # Worsening (positive values) -> Red
    worsening = np.clip(change_heatmap, 0, 1)
    heatmap_rgb[:, :, 0] = worsening * 255  # Red channel
    
    # Create blend
    overlay = image_rgb.copy().astype(np.float32)
    
    # Determine where to blend (where change is non-zero)
    change_presence = np.abs(change_heatmap) > 0.01
    
    if mask is not None:
        change_presence = change_presence & (mask == 1)
    
    mask_3d = np.expand_dims(change_presence, axis=2).astype(np.float32)
    blended = overlay * (1 - alpha * mask_3d) + heatmap_rgb * alpha * mask_3d
    
    return np.clip(blended, 0, 255).astype(np.uint8)


def get_colored_heatmap(
    heatmap: np.ndarray,
    colormap: str = "jet"
) -> np.ndarray:
    """
    Apply colormap to a heatmap and return as RGB uint8.
    
    Args:
        heatmap: Heatmap values (H, W), float32 in [0, 1]
        colormap: OpenCV colormap name
        
    Returns:
        RGB image (H, W, 3), dtype uint8
    """
    cv2 = _ensure_cv2()
    
    if heatmap is None:
        return None
        
    # Ensure heatmap is in range [0, 255] for colormap
    heatmap_uint8 = (np.clip(heatmap, 0, 1) * 255).astype(np.uint8)
    
    # Select colormap
    colormap_dict = {
        "jet": cv2.COLORMAP_JET,
        "hot": cv2.COLORMAP_HOT,
        "rainbow": cv2.COLORMAP_RAINBOW,
        "inferno": cv2.COLORMAP_INFERNO,
        "viridis": cv2.COLORMAP_VIRIDIS,
    }
    cv_colormap = colormap_dict.get(colormap, cv2.COLORMAP_JET)
    
    # Apply colormap (returns BGR)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv_colormap)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    
    # Create RGBA image
    h, w = heatmap.shape
    heatmap_rgba = np.zeros((h, w, 4), dtype=np.uint8)
    heatmap_rgba[:, :, :3] = heatmap_colored_rgb
    
    # Set alpha: 0 where heatmap is 0, 255 elsewhere
    # (Note: we use a small threshold to avoid float precision issues)
    heatmap_rgba[:, :, 3] = (heatmap > 0.001).astype(np.uint8) * 255
    
    return heatmap_rgba


# ============================================================
# HEATMAP AVAILABILITY CHECK
# ============================================================

def should_generate_heatmaps(segmentation_source: str) -> bool:
    """
    Check if heatmaps should be generated based on segmentation source.
    
    Args:
        segmentation_source: Source of segmentation masks
                             "mobilesam" = real model, heatmaps allowed
                             "fallback" or "demo" = circular mask, NO heatmaps
    
    Returns:
        True if heatmaps should be generated, False otherwise.
    
    CRITICAL RULE:
        Heatmaps are NEVER generated for fallback/demo masks.
        This preserves trust and avoids misleading visualizations.
    """
    # Only generate heatmaps for real MobileSAM segmentation
    allowed_sources = {"mobilesam", "mobile_sam", "model", "real"}
    return segmentation_source.lower() in allowed_sources


# ============================================================
# SELF-TEST
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("HEATMAP SERVICE SELF-TEST")
    print("=" * 60)
    
    # Create synthetic test data
    print("\nCreating synthetic test data...")
    
    # Synthetic image (480x640)
    h, w = 480, 640
    test_image = np.zeros((h, w, 3), dtype=np.uint8)
    
    # Add some red-ish region
    test_image[200:280, 280:360] = [200, 100, 100]  # Reddish
    
    # Add some yellow-ish region
    test_image[220:260, 300:340] = [230, 220, 150]  # Yellowish
    
    # Create wound mask (circular, center)
    wound_mask = np.zeros((h, w), dtype=np.uint8)
    cv2 = _ensure_cv2()
    cv2.circle(wound_mask, (320, 240), 50, 1, -1)
    
    # Create peri-wound mask (ring around wound)
    peri_wound_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.circle(peri_wound_mask, (320, 240), 70, 1, -1)
    peri_wound_mask[wound_mask == 1] = 0  # Remove wound from peri-wound
    
    combined_mask = np.clip(wound_mask + peri_wound_mask, 0, 1).astype(np.uint8)
    
    print(f"  Image shape: {test_image.shape}")
    print(f"  Wound mask pixels: {np.sum(wound_mask)}")
    print(f"  Peri-wound mask pixels: {np.sum(peri_wound_mask)}")
    
    # Test redness heatmap
    print("\nTest 1: Redness heatmap...")
    redness = generate_redness_heatmap(test_image, peri_wound_mask)
    assert redness is not None, "Redness heatmap returned None"
    assert redness.shape == (h, w), f"Shape mismatch: {redness.shape}"
    assert redness.dtype == np.float32, f"Dtype mismatch: {redness.dtype}"
    assert np.max(redness) <= 1.0, f"Max value > 1: {np.max(redness)}"
    assert np.min(redness) >= 0.0, f"Min value < 0: {np.min(redness)}"
    assert np.all(redness[peri_wound_mask == 0] == 0), "Non-zero outside mask"
    print("  PASSED")
    
    # Test exudate heatmap
    print("\nTest 2: Exudate heatmap...")
    exudate = generate_exudate_heatmap(test_image, wound_mask)
    assert exudate is not None, "Exudate heatmap returned None"
    assert exudate.shape == (h, w), f"Shape mismatch: {exudate.shape}"
    assert exudate.dtype == np.float32, f"Dtype mismatch: {exudate.dtype}"
    assert np.max(exudate) <= 1.0, f"Max value > 1: {np.max(exudate)}"
    assert np.min(exudate) >= 0.0, f"Min value < 0: {np.min(exudate)}"
    assert np.all(exudate[wound_mask == 0] == 0), "Non-zero outside mask"
    print("  PASSED")
    
    # Test change heatmap
    print("\nTest 3: Change heatmap...")
    redness_day1 = redness.copy()
    redness_day2 = redness.copy()
    redness_day2[redness_day2 > 0] *= 1.2  # Simulate worsening
    change = generate_change_heatmap(redness_day1, redness_day2, combined_mask)
    assert change is not None, "Change heatmap returned None"
    assert change.shape == (h, w), f"Shape mismatch: {change.shape}"
    assert change.dtype == np.float32, f"Dtype mismatch: {change.dtype}"
    assert np.max(change) <= 1.0, f"Max value > 1: {np.max(change)}"
    assert np.min(change) >= -1.0, f"Min value < -1: {np.min(change)}"
    assert np.all(change[combined_mask == 0] == 0), "Non-zero outside mask"
    print("  PASSED")
    
    # Test availability check
    print("\nTest 4: Heatmap availability check...")
    assert should_generate_heatmaps("mobilesam") == True
    assert should_generate_heatmaps("MobileSAM") == True
    assert should_generate_heatmaps("model") == True
    assert should_generate_heatmaps("fallback") == False
    assert should_generate_heatmaps("demo") == False
    assert should_generate_heatmaps("FALLBACK") == False
    print("  PASSED")
    
    # Test overlay functions
    print("\nTest 5: Overlay functions...")
    overlay1 = apply_heatmap_overlay(test_image, redness, alpha=0.5)
    assert overlay1 is not None
    assert overlay1.shape == test_image.shape
    assert overlay1.dtype == np.uint8
    
    overlay2 = apply_change_heatmap_overlay(test_image, change, alpha=0.5)
    assert overlay2 is not None
    assert overlay2.shape == test_image.shape
    assert overlay2.dtype == np.uint8
    print("  PASSED")
    
    print("\n" + "=" * 60)
    print("ALL HEATMAP SELF-TESTS PASSED")
    print("=" * 60)
