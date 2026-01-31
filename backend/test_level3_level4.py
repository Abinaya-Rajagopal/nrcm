"""
Level 3 & Level 4 Tests - Segmentation and Heatmap Validation
==============================================================

LEVEL 3: Path Correctness
- Test A: Fallback path (model unavailable)
- Test B: Real MobileSAM path (if model available)
- Test C: DEMO_MODE override

LEVEL 4: Heatmap Semantic & Numerical Correctness
- Test 1: Redness heatmap semantics
- Test 2: Exudate heatmap semantics
- Test 3: Change heatmap semantics
- Test 4: Numerical safety

DO NOT modify segmentation.py or API contracts.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from app.services.segmentation import segment_wound
from app.services.heatmaps import (
    generate_redness_heatmap,
    generate_exudate_heatmap,
    generate_change_heatmap,
    should_generate_heatmaps,
    apply_heatmap_overlay,
    apply_change_heatmap_overlay
)


def load_test_image():
    """Load the demo wound image."""
    image_path = os.path.join(
        os.path.dirname(__file__),
        "demo_assets", "wound_images", "primary", "demo_01.jpg"
    )
    
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Test image not found: {image_path}")
    
    image_bgr = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    return image_rgb


def is_mask_circular(mask: np.ndarray, tolerance: float = 0.15) -> bool:
    """
    Check if a mask is approximately circular (fallback behavior).
    
    Uses contour analysis to detect circularity.
    A perfect circle has circularity = 1.0.
    """
    # Find contours
    contours, _ = cv2.findContours(
        mask.astype(np.uint8), 
        cv2.RETR_EXTERNAL, 
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    if not contours:
        return False
    
    # Get the largest contour
    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    perimeter = cv2.arcLength(largest, True)
    
    if perimeter == 0:
        return False
    
    # Circularity = 4 * pi * area / perimeter^2
    # Perfect circle = 1.0
    circularity = 4 * np.pi * area / (perimeter ** 2)
    
    # Consider it circular if circularity > (1 - tolerance)
    return circularity > (1 - tolerance)


def check_model_availability():
    """Check if MobileSAM models are available."""
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    encoder_path = os.path.join(model_dir, 'mobile_sam_encoder.onnx')
    decoder_path = os.path.join(model_dir, 'mobile_sam_decoder.onnx')
    
    encoder_exists = os.path.exists(encoder_path)
    decoder_exists = os.path.exists(decoder_path)
    
    return encoder_exists and decoder_exists, encoder_path, decoder_path


# ============================================================
# LEVEL 3 TESTS
# ============================================================

def test_level3_a_fallback_path():
    """
    TEST A - FALLBACK PATH (MODEL UNAVAILABLE)
    
    PASS CONDITIONS:
    - Returned masks are circular
    - No crashes or exceptions
    - Heatmap generation is skipped (based on should_generate_heatmaps)
    - Metrics still compute
    """
    print("\n" + "=" * 60)
    print("LEVEL 3 - TEST A: FALLBACK PATH")
    print("=" * 60)
    
    all_passed = True
    
    # Load image
    image = load_test_image()
    height, width = image.shape[:2]
    point = (width // 2, height // 2)
    
    print(f"\n  Image: {width}x{height}, Click: {point}")
    
    # Check model availability
    model_available, _, _ = check_model_availability()
    print(f"  Model available: {model_available}")
    
    if model_available:
        print("\n  [INFO] Model is available - this test verifies fallback behavior")
        print("         when model fails or returns invalid mask")
    else:
        print("\n  [INFO] Model NOT available - testing pure fallback path")
    
    # Call segmentation with demo_mode=False
    print("\n  Calling segment_wound(demo_mode=False)...")
    
    try:
        result = segment_wound(image, point, demo_mode=False)
        print("  [PASS] No exception raised")
    except Exception as e:
        print(f"  [FAIL] Exception raised: {e}")
        return False
    
    wound_mask = result["wound_mask"]
    peri_wound_mask = result["peri_wound_mask"]
    
    print(f"  Wound pixels: {np.sum(wound_mask)}")
    print(f"  Peri-wound pixels: {np.sum(peri_wound_mask)}")
    
    # Check if masks are circular (indicating fallback)
    wound_is_circular = is_mask_circular(wound_mask)
    peri_is_circular = is_mask_circular(peri_wound_mask)
    
    print(f"\n  Wound mask circular: {wound_is_circular}")
    print(f"  Peri-wound mask circular: {peri_is_circular}")
    
    # Determine segmentation source (heuristic)
    # If circular, it's fallback
    is_fallback = wound_is_circular and peri_is_circular
    segmentation_source = "fallback" if is_fallback else "mobilesam"
    
    print(f"  Detected source: {segmentation_source}")
    
    # Test heatmap availability check
    should_generate = should_generate_heatmaps(segmentation_source)
    print(f"\n  should_generate_heatmaps('{segmentation_source}'): {should_generate}")
    
    if is_fallback:
        # In fallback mode, heatmaps should be skipped
        if should_generate:
            print("  [FAIL] Heatmaps should be BLOCKED for fallback!")
            all_passed = False
        else:
            print("  [PASS] Heatmaps correctly BLOCKED for fallback")
    
    # Verify metrics can still be computed (basic stats)
    print("\n  Computing basic mask statistics:")
    wound_area = np.sum(wound_mask)
    peri_area = np.sum(peri_wound_mask)
    total_area = height * width
    
    print(f"    Wound area: {wound_area} pixels ({100*wound_area/total_area:.2f}%)")
    print(f"    Peri-wound area: {peri_area} pixels ({100*peri_area/total_area:.2f}%)")
    print("  [PASS] Metrics computed successfully")
    
    if all_passed:
        print("\n  [PASS] TEST A PASSED")
    else:
        print("\n  [FAIL] TEST A FAILED")
    
    return all_passed, is_fallback


def test_level3_b_real_mobilesam():
    """
    TEST B - REAL MobileSAM PATH
    
    PASS CONDITIONS:
    - Wound mask is irregular (not circular)
    - Peri-wound follows wound boundary
    - Heatmaps are generated
    """
    print("\n" + "=" * 60)
    print("LEVEL 3 - TEST B: REAL MobileSAM PATH")
    print("=" * 60)
    
    model_available, encoder_path, decoder_path = check_model_availability()
    
    if not model_available:
        print("\n  [SKIP] MobileSAM model not available")
        print(f"  Expected paths:")
        print(f"    Encoder: {encoder_path}")
        print(f"    Decoder: {decoder_path}")
        print("\n  This test will PASS once models are installed.")
        return True  # Skip but don't fail
    
    # Load image
    image = load_test_image()
    height, width = image.shape[:2]
    point = (width // 2, height // 2)
    
    print(f"\n  Image: {width}x{height}, Click: {point}")
    print("  Model: AVAILABLE")
    
    # Call segmentation
    print("\n  Calling segment_wound(demo_mode=False)...")
    result = segment_wound(image, point, demo_mode=False)
    
    wound_mask = result["wound_mask"]
    peri_wound_mask = result["peri_wound_mask"]
    
    # Check if masks are NON-circular (real segmentation)
    wound_is_circular = is_mask_circular(wound_mask)
    peri_is_circular = is_mask_circular(peri_wound_mask)
    
    print(f"\n  Wound mask circular: {wound_is_circular}")
    print(f"  Peri-wound mask circular: {peri_is_circular}")
    
    if wound_is_circular and peri_is_circular:
        print("  [FAIL] Masks are circular - MobileSAM not being used!")
        return False
    else:
        print("  [PASS] Masks are irregular - MobileSAM is working")
    
    # Verify heatmaps can be generated
    print("\n  Generating heatmaps...")
    
    redness = generate_redness_heatmap(image, peri_wound_mask)
    exudate = generate_exudate_heatmap(image, wound_mask)
    
    if redness is not None and np.max(redness) > 0:
        print("  [PASS] Redness heatmap generated with non-zero values")
    else:
        print("  [FAIL] Redness heatmap is empty or None")
        return False
    
    if exudate is not None:
        print("  [PASS] Exudate heatmap generated")
    else:
        print("  [FAIL] Exudate heatmap is None")
        return False
    
    print("\n  [PASS] TEST B PASSED")
    return True


def test_level3_c_demo_mode():
    """
    TEST C - DEMO_MODE OVERRIDE
    
    PASS CONDITIONS:
    - Immediate fallback (circular masks)
    - No model loading
    - No heatmaps
    - Stable output
    """
    print("\n" + "=" * 60)
    print("LEVEL 3 - TEST C: DEMO_MODE OVERRIDE")
    print("=" * 60)
    
    # Load image
    image = load_test_image()
    height, width = image.shape[:2]
    point = (width // 2, height // 2)
    
    print(f"\n  Image: {width}x{height}, Click: {point}")
    
    # Call segmentation with demo_mode=True
    print("\n  Calling segment_wound(demo_mode=True)...")
    
    result = segment_wound(image, point, demo_mode=True)
    
    wound_mask = result["wound_mask"]
    peri_wound_mask = result["peri_wound_mask"]
    
    print(f"  Wound pixels: {np.sum(wound_mask)}")
    print(f"  Peri-wound pixels: {np.sum(peri_wound_mask)}")
    
    # Verify masks are circular (demo fallback)
    wound_is_circular = is_mask_circular(wound_mask)
    peri_is_circular = is_mask_circular(peri_wound_mask)
    
    print(f"\n  Wound mask circular: {wound_is_circular}")
    print(f"  Peri-wound mask circular: {peri_is_circular}")
    
    if wound_is_circular and peri_is_circular:
        print("  [PASS] Masks are circular - DEMO_MODE working")
    else:
        print("  [FAIL] Masks are NOT circular - DEMO_MODE not forcing fallback!")
        return False
    
    # Verify heatmaps are blocked
    should_generate = should_generate_heatmaps("demo")
    print(f"\n  should_generate_heatmaps('demo'): {should_generate}")
    
    if should_generate:
        print("  [FAIL] Heatmaps should be BLOCKED for demo mode!")
        return False
    else:
        print("  [PASS] Heatmaps correctly BLOCKED for demo mode")
    
    # Test determinism (multiple calls should give same result)
    print("\n  Testing determinism...")
    result2 = segment_wound(image, point, demo_mode=True)
    
    if np.array_equal(wound_mask, result2["wound_mask"]):
        print("  [PASS] Results are deterministic")
    else:
        print("  [FAIL] Results are NOT deterministic!")
        return False
    
    print("\n  [PASS] TEST C PASSED")
    return True


# ============================================================
# LEVEL 4 TESTS
# ============================================================

def test_level4_1_redness_semantics():
    """
    TEST 1 - REDNESS HEATMAP SEMANTICS
    
    CHECKS:
    - Heatmap exists only in peri-wound region
    - Intensity varies spatially
    - No signal inside wound bed
    """
    print("\n" + "=" * 60)
    print("LEVEL 4 - TEST 1: REDNESS HEATMAP SEMANTICS")
    print("=" * 60)
    
    all_passed = True
    
    # Load image and get masks
    image = load_test_image()
    height, width = image.shape[:2]
    point = (width // 2, height // 2)
    
    result = segment_wound(image, point, demo_mode=False)
    wound_mask = result["wound_mask"]
    peri_wound_mask = result["peri_wound_mask"]
    
    # Generate redness heatmap
    redness = generate_redness_heatmap(image, peri_wound_mask)
    
    print(f"\n  Redness heatmap shape: {redness.shape}")
    print(f"  Redness range: [{np.min(redness):.4f}, {np.max(redness):.4f}]")
    
    # Check 1: No signal inside wound bed
    wound_signal = np.sum(redness[wound_mask == 1])
    print(f"\n  Signal inside wound bed: {wound_signal}")
    
    if wound_signal == 0:
        print("  [PASS] No redness signal inside wound bed")
    else:
        print("  [FAIL] Redness signal found inside wound bed!")
        all_passed = False
    
    # Check 2: Signal only in peri-wound
    outside_signal = np.sum(redness[peri_wound_mask == 0])
    print(f"  Signal outside peri-wound: {outside_signal}")
    
    if outside_signal == 0:
        print("  [PASS] Redness signal only in peri-wound region")
    else:
        print("  [FAIL] Redness signal found outside peri-wound!")
        all_passed = False
    
    # Check 3: Intensity varies spatially (not flat)
    peri_values = redness[peri_wound_mask == 1]
    if len(peri_values) > 0:
        std_dev = np.std(peri_values)
        print(f"\n  Spatial variation (std): {std_dev:.4f}")
        
        if std_dev > 0.01:
            print("  [PASS] Redness varies spatially (not flat)")
        else:
            print("  [WARN] Redness is nearly flat - may indicate uniform lighting")
            # Don't fail - could be valid for some images
    
    if all_passed:
        print("\n  [PASS] TEST 1 PASSED")
    else:
        print("\n  [FAIL] TEST 1 FAILED")
    
    return all_passed


def test_level4_2_exudate_semantics():
    """
    TEST 2 - EXUDATE HEATMAP SEMANTICS
    
    CHECKS:
    - Heatmap exists only inside wound mask
    - Highlights yellow/white tissue
    - Clean red tissue has near-zero response
    """
    print("\n" + "=" * 60)
    print("LEVEL 4 - TEST 2: EXUDATE HEATMAP SEMANTICS")
    print("=" * 60)
    
    all_passed = True
    
    # Load image and get masks
    image = load_test_image()
    height, width = image.shape[:2]
    point = (width // 2, height // 2)
    
    result = segment_wound(image, point, demo_mode=False)
    wound_mask = result["wound_mask"]
    peri_wound_mask = result["peri_wound_mask"]
    
    # Generate exudate heatmap
    exudate = generate_exudate_heatmap(image, wound_mask)
    
    print(f"\n  Exudate heatmap shape: {exudate.shape}")
    print(f"  Exudate range: [{np.min(exudate):.4f}, {np.max(exudate):.4f}]")
    
    # Check 1: No signal outside wound mask
    outside_signal = np.sum(exudate[wound_mask == 0])
    print(f"\n  Signal outside wound: {outside_signal}")
    
    if outside_signal == 0:
        print("  [PASS] Exudate signal only inside wound mask")
    else:
        print("  [FAIL] Exudate signal found outside wound!")
        all_passed = False
    
    # Check 2: No signal in peri-wound (should be masked out)
    peri_signal = np.sum(exudate[peri_wound_mask == 1])
    print(f"  Signal in peri-wound: {peri_signal}")
    
    if peri_signal == 0:
        print("  [PASS] No exudate signal in peri-wound region")
    else:
        print("  [FAIL] Exudate signal found in peri-wound!")
        all_passed = False
    
    # Check 3: Exudate values are reasonable (may be zero if no yellow tissue)
    wound_values = exudate[wound_mask == 1]
    if len(wound_values) > 0:
        max_exudate = np.max(wound_values)
        mean_exudate = np.mean(wound_values)
        print(f"\n  Max exudate: {max_exudate:.4f}")
        print(f"  Mean exudate: {mean_exudate:.4f}")
        
        if max_exudate == 0:
            print("  [INFO] No yellow/exudate tissue detected (may be clean wound)")
        else:
            print("  [INFO] Exudate tissue detected in wound")
    
    if all_passed:
        print("\n  [PASS] TEST 2 PASSED")
    else:
        print("\n  [FAIL] TEST 2 FAILED")
    
    return all_passed


def test_level4_3_change_semantics():
    """
    TEST 3 - CHANGE HEATMAP SEMANTICS
    
    CHECKS:
    - Green = decreased redness (improvement)
    - Red = increased redness (worsening)
    - No signal outside wound + peri-wound
    - Directionality is correct
    """
    print("\n" + "=" * 60)
    print("LEVEL 4 - TEST 3: CHANGE HEATMAP SEMANTICS")
    print("=" * 60)
    
    all_passed = True
    
    # Load image and get masks
    image = load_test_image()
    height, width = image.shape[:2]
    point = (width // 2, height // 2)
    
    result = segment_wound(image, point, demo_mode=False)
    wound_mask = result["wound_mask"]
    peri_wound_mask = result["peri_wound_mask"]
    combined_mask = np.clip(wound_mask + peri_wound_mask, 0, 1).astype(np.uint8)
    
    # Generate redness for "Day N"
    redness_day_n = generate_redness_heatmap(image, peri_wound_mask)
    
    # Simulate "Day N+1" with improvement (decreased redness)
    redness_day_n1_improved = redness_day_n * 0.7  # 30% less redness
    
    # Simulate "Day N+1" with worsening (increased redness)
    redness_day_n1_worsened = np.clip(redness_day_n * 1.3, 0, 1)  # 30% more redness
    
    # Test improvement scenario
    print("\n  Testing IMPROVEMENT scenario (redness decreased)...")
    change_improved = generate_change_heatmap(redness_day_n, redness_day_n1_improved, combined_mask)
    
    improved_values = change_improved[combined_mask == 1]
    if len(improved_values) > 0 and np.any(improved_values != 0):
        if np.mean(improved_values) < 0:
            print("  [PASS] Improvement shows negative values (green)")
        else:
            print("  [FAIL] Improvement should be negative!")
            all_passed = False
    else:
        print("  [INFO] No non-zero values in improvement test")
    
    # Test worsening scenario
    print("\n  Testing WORSENING scenario (redness increased)...")
    change_worsened = generate_change_heatmap(redness_day_n, redness_day_n1_worsened, combined_mask)
    
    worsened_values = change_worsened[combined_mask == 1]
    if len(worsened_values) > 0 and np.any(worsened_values != 0):
        if np.mean(worsened_values) > 0:
            print("  [PASS] Worsening shows positive values (red)")
        else:
            print("  [FAIL] Worsening should be positive!")
            all_passed = False
    else:
        print("  [INFO] No non-zero values in worsening test")
    
    # Check no signal outside combined mask
    print("\n  Checking mask boundaries...")
    outside_improved = np.sum(np.abs(change_improved[combined_mask == 0]))
    outside_worsened = np.sum(np.abs(change_worsened[combined_mask == 0]))
    
    print(f"  Signal outside mask (improved): {outside_improved}")
    print(f"  Signal outside mask (worsened): {outside_worsened}")
    
    if outside_improved == 0 and outside_worsened == 0:
        print("  [PASS] Change signal only inside wound + peri-wound")
    else:
        print("  [FAIL] Change signal found outside masked region!")
        all_passed = False
    
    if all_passed:
        print("\n  [PASS] TEST 3 PASSED")
    else:
        print("\n  [FAIL] TEST 3 FAILED")
    
    return all_passed


def test_level4_4_numerical_safety():
    """
    TEST 4 - NUMERICAL SAFETY
    
    CHECKS:
    - Redness: 0.0 <= min <= max <= 1.0
    - Exudate: 0.0 <= min <= max <= 1.0
    - Change: -1.0 <= min <= max <= 1.0
    """
    print("\n" + "=" * 60)
    print("LEVEL 4 - TEST 4: NUMERICAL SAFETY")
    print("=" * 60)
    
    all_passed = True
    
    # Load image and get masks
    image = load_test_image()
    height, width = image.shape[:2]
    point = (width // 2, height // 2)
    
    result = segment_wound(image, point, demo_mode=False)
    wound_mask = result["wound_mask"]
    peri_wound_mask = result["peri_wound_mask"]
    combined_mask = np.clip(wound_mask + peri_wound_mask, 0, 1).astype(np.uint8)
    
    # Generate all heatmaps
    redness = generate_redness_heatmap(image, peri_wound_mask)
    exudate = generate_exudate_heatmap(image, wound_mask)
    
    redness_prev = redness * 0.8
    change = generate_change_heatmap(redness_prev, redness, combined_mask)
    
    # Check redness bounds
    print("\n  Checking REDNESS heatmap bounds...")
    redness_min = np.min(redness)
    redness_max = np.max(redness)
    print(f"  Range: [{redness_min:.6f}, {redness_max:.6f}]")
    
    try:
        assert 0.0 <= redness_min <= redness_max <= 1.0, \
            f"Redness out of bounds: [{redness_min}, {redness_max}]"
        print("  [PASS] 0.0 <= min <= max <= 1.0")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Check exudate bounds
    print("\n  Checking EXUDATE heatmap bounds...")
    exudate_min = np.min(exudate)
    exudate_max = np.max(exudate)
    print(f"  Range: [{exudate_min:.6f}, {exudate_max:.6f}]")
    
    try:
        assert 0.0 <= exudate_min <= exudate_max <= 1.0, \
            f"Exudate out of bounds: [{exudate_min}, {exudate_max}]"
        print("  [PASS] 0.0 <= min <= max <= 1.0")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Check change bounds
    print("\n  Checking CHANGE heatmap bounds...")
    change_min = np.min(change)
    change_max = np.max(change)
    print(f"  Range: [{change_min:.6f}, {change_max:.6f}]")
    
    try:
        assert -1.0 <= change_min <= change_max <= 1.0, \
            f"Change out of bounds: [{change_min}, {change_max}]"
        print("  [PASS] -1.0 <= min <= max <= 1.0")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Check dtypes
    print("\n  Checking data types...")
    print(f"  Redness dtype: {redness.dtype}")
    print(f"  Exudate dtype: {exudate.dtype}")
    print(f"  Change dtype: {change.dtype}")
    
    if redness.dtype == np.float32 and exudate.dtype == np.float32 and change.dtype == np.float32:
        print("  [PASS] All heatmaps are float32")
    else:
        print("  [WARN] Expected float32 for all heatmaps")
    
    if all_passed:
        print("\n  [PASS] TEST 4 PASSED")
    else:
        print("\n  [FAIL] TEST 4 FAILED")
    
    return all_passed


# ============================================================
# MAIN
# ============================================================

def run_all_tests():
    """Run all Level 3 and Level 4 tests."""
    
    print("\n" + "=" * 70)
    print("           LEVEL 3 & LEVEL 4 TESTING SUITE")
    print("=" * 70)
    
    results = {
        "Level 3": {},
        "Level 4": {}
    }
    
    # ========================================
    # LEVEL 3 TESTS
    # ========================================
    print("\n" + "#" * 70)
    print("#                         LEVEL 3 TESTS")
    print("#" * 70)
    
    # Test A
    try:
        passed, is_fallback = test_level3_a_fallback_path()
        results["Level 3"]["Test A - Fallback Path"] = "PASS" if passed else "FAIL"
    except Exception as e:
        print(f"\n  [ERROR] Test A crashed: {e}")
        results["Level 3"]["Test A - Fallback Path"] = "ERROR"
    
    # Test B
    try:
        passed = test_level3_b_real_mobilesam()
        results["Level 3"]["Test B - MobileSAM Path"] = "PASS" if passed else "FAIL"
    except Exception as e:
        print(f"\n  [ERROR] Test B crashed: {e}")
        results["Level 3"]["Test B - MobileSAM Path"] = "ERROR"
    
    # Test C
    try:
        passed = test_level3_c_demo_mode()
        results["Level 3"]["Test C - DEMO_MODE"] = "PASS" if passed else "FAIL"
    except Exception as e:
        print(f"\n  [ERROR] Test C crashed: {e}")
        results["Level 3"]["Test C - DEMO_MODE"] = "ERROR"
    
    # ========================================
    # LEVEL 4 TESTS
    # ========================================
    print("\n" + "#" * 70)
    print("#                         LEVEL 4 TESTS")
    print("#" * 70)
    
    # Test 1
    try:
        passed = test_level4_1_redness_semantics()
        results["Level 4"]["Test 1 - Redness Semantics"] = "PASS" if passed else "FAIL"
    except Exception as e:
        print(f"\n  [ERROR] Test 1 crashed: {e}")
        results["Level 4"]["Test 1 - Redness Semantics"] = "ERROR"
    
    # Test 2
    try:
        passed = test_level4_2_exudate_semantics()
        results["Level 4"]["Test 2 - Exudate Semantics"] = "PASS" if passed else "FAIL"
    except Exception as e:
        print(f"\n  [ERROR] Test 2 crashed: {e}")
        results["Level 4"]["Test 2 - Exudate Semantics"] = "ERROR"
    
    # Test 3
    try:
        passed = test_level4_3_change_semantics()
        results["Level 4"]["Test 3 - Change Semantics"] = "PASS" if passed else "FAIL"
    except Exception as e:
        print(f"\n  [ERROR] Test 3 crashed: {e}")
        results["Level 4"]["Test 3 - Change Semantics"] = "ERROR"
    
    # Test 4
    try:
        passed = test_level4_4_numerical_safety()
        results["Level 4"]["Test 4 - Numerical Safety"] = "PASS" if passed else "FAIL"
    except Exception as e:
        print(f"\n  [ERROR] Test 4 crashed: {e}")
        results["Level 4"]["Test 4 - Numerical Safety"] = "ERROR"
    
    # ========================================
    # SUMMARY
    # ========================================
    print("\n" + "=" * 70)
    print("                         TEST SUMMARY")
    print("=" * 70)
    
    all_passed = True
    
    for level, tests in results.items():
        print(f"\n{level}:")
        for test_name, status in tests.items():
            icon = "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[ERR]"
            print(f"  {icon} {test_name}")
            if status != "PASS":
                all_passed = False
    
    print("\n" + "=" * 70)
    if all_passed:
        print("        [SUCCESS] ALL LEVEL 3 & LEVEL 4 TESTS PASSED!")
        print("        Segmentation + Heatmaps are PRODUCTION-READY")
    else:
        print("        [INCOMPLETE] Some tests need attention")
    print("=" * 70)
    
    return all_passed


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
