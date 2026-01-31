"""
Wound Segmentation Test - Level 1 & Level 2
============================================

Level 1: Functional correctness (assertions)
Level 2: Visual sanity (overlay visualization)

DO NOT test DEMO_MODE (demo_mode=False only)
DO NOT modify segmentation.py
"""

import sys
import os

# Add the backend directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import cv2
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt

from app.services.segmentation import segment_wound


def run_level1_and_level2_tests():
    """Run Level 1 (functional) and Level 2 (visual sanity) tests."""
    
    print("=" * 60)
    print("WOUND SEGMENTATION TEST - LEVEL 1 & LEVEL 2")
    print("=" * 60)
    
    # ========================================
    # STEP 1: Load image
    # ========================================
    print("\n[STEP 1] Loading demo image...")
    
    image_path = os.path.join(
        os.path.dirname(__file__),
        "demo_assets", "wound_images", "primary", "demo_01.jpg"
    )
    
    if not os.path.exists(image_path):
        print(f"  ERROR: Image not found at {image_path}")
        return False
    
    # Load image with OpenCV (returns BGR)
    image_bgr = cv2.imread(image_path)
    
    if image_bgr is None:
        print(f"  ERROR: Failed to load image from {image_path}")
        return False
    
    # Convert BGR to RGB explicitly
    image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    
    height, width = image.shape[:2]
    print(f"  Image loaded: {width}x{height}")
    print(f"  Image dtype: {image.dtype}")
    print(f"  Image shape: {image.shape}")
    print("  [OK] Image converted to RGB")
    
    # ========================================
    # STEP 2: Call segmentation
    # ========================================
    print("\n[STEP 2] Calling segment_wound (demo_mode=False)...")
    
    # Choose center of image as click point
    point = (width // 2, height // 2)
    print(f"  Click point: {point}")
    
    out = segment_wound(image, point, demo_mode=False)
    
    print("  [OK] segment_wound returned")
    
    # ========================================
    # STEP 3: Level 1 - Assertions (MANDATORY)
    # ========================================
    print("\n[STEP 3] Level 1 - Functional Assertions...")
    
    all_passed = True
    
    # Assertion 1: Output is dict
    try:
        assert isinstance(out, dict), f"Expected dict, got {type(out)}"
        print("  [PASS] Output is dict")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Assertion 2: wound_mask key exists
    try:
        assert "wound_mask" in out, "Missing 'wound_mask' key"
        print("  [PASS] 'wound_mask' key exists")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Assertion 3: peri_wound_mask key exists
    try:
        assert "peri_wound_mask" in out, "Missing 'peri_wound_mask' key"
        print("  [PASS] 'peri_wound_mask' key exists")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    wound = out["wound_mask"]
    peri = out["peri_wound_mask"]
    
    # Assertion 4: wound_mask shape matches image
    try:
        assert wound.shape == image.shape[:2], \
            f"wound_mask shape {wound.shape} != image shape {image.shape[:2]}"
        print(f"  [PASS] wound_mask shape = {wound.shape}")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Assertion 5: peri_wound_mask shape matches image
    try:
        assert peri.shape == image.shape[:2], \
            f"peri_wound_mask shape {peri.shape} != image shape {image.shape[:2]}"
        print(f"  [PASS] peri_wound_mask shape = {peri.shape}")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Assertion 6: wound_mask dtype is uint8
    try:
        assert wound.dtype == np.uint8, f"wound_mask dtype {wound.dtype} != uint8"
        print(f"  [PASS] wound_mask dtype = {wound.dtype}")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Assertion 7: peri_wound_mask dtype is uint8
    try:
        assert peri.dtype == np.uint8, f"peri_wound_mask dtype {peri.dtype} != uint8"
        print(f"  [PASS] peri_wound_mask dtype = {peri.dtype}")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Assertion 8: wound_mask is binary {0, 1}
    try:
        wound_unique = set(np.unique(wound))
        assert wound_unique.issubset({0, 1}), \
            f"wound_mask values {wound_unique} not subset of {{0, 1}}"
        print(f"  [PASS] wound_mask is binary: {wound_unique}")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Assertion 9: peri_wound_mask is binary {0, 1}
    try:
        peri_unique = set(np.unique(peri))
        assert peri_unique.issubset({0, 1}), \
            f"peri_wound_mask values {peri_unique} not subset of {{0, 1}}"
        print(f"  [PASS] peri_wound_mask is binary: {peri_unique}")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Assertion 10: No overlap between wound and peri-wound
    try:
        overlap = np.sum(wound & peri)
        assert overlap == 0, f"Masks overlap by {overlap} pixels"
        print(f"  [PASS] No overlap between masks (overlap = {overlap})")
    except AssertionError as e:
        print(f"  [FAIL] {e}")
        all_passed = False
    
    # Summary
    if all_passed:
        print("\n  [OK] LEVEL 1: ALL ASSERTIONS PASSED")
    else:
        print("\n  [FAIL] LEVEL 1: SOME ASSERTIONS FAILED")
        return False
    
    # Print mask statistics
    print("\n  --- Mask Statistics ---")
    print(f"  Wound pixels: {np.sum(wound)} ({100 * np.sum(wound) / wound.size:.2f}%)")
    print(f"  Peri-wound pixels: {np.sum(peri)} ({100 * np.sum(peri) / peri.size:.2f}%)")
    
    # ========================================
    # STEP 4 & 5: Level 2 - Visual Sanity Check
    # ========================================
    print("\n[STEP 4-5] Level 2 - Visual Sanity Check...")
    
    # Create overlay
    overlay = image.copy()
    
    # Apply red for wound mask
    overlay[wound == 1] = [255, 0, 0]  # Red for wound
    
    # Apply green for peri-wound mask
    overlay[peri == 1] = [0, 255, 0]   # Green for peri-wound
    
    # Create figure with subplots
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    
    # Original image
    axes[0].imshow(image)
    axes[0].set_title("Original Image")
    axes[0].axis('off')
    
    # Masks side by side
    combined_mask = np.zeros((height, width, 3), dtype=np.uint8)
    combined_mask[wound == 1] = [255, 0, 0]  # Red
    combined_mask[peri == 1] = [0, 255, 0]   # Green
    axes[1].imshow(combined_mask)
    axes[1].set_title("Masks (Red=Wound, Green=Peri-wound)")
    axes[1].axis('off')
    
    # Overlay on original
    axes[2].imshow(overlay)
    axes[2].set_title("Overlay (Red=Wound, Green=Peri-wound)")
    axes[2].plot(point[0], point[1], 'yo', markersize=10, markeredgecolor='black')
    axes[2].axis('off')
    
    plt.suptitle(f"Wound Segmentation Test - Click Point: {point}", fontsize=14)
    plt.tight_layout()
    
    # Save the visualization
    output_path = os.path.join(
        os.path.dirname(__file__),
        "test_segmentation_visualization.png"
    )
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    print(f"\n  Visualization saved to: {output_path}")
    
    # Close the figure to free memory
    plt.close(fig)
    
    print("\n" + "=" * 60)
    print("VISUAL INSPECTION CRITERIA")
    print("=" * 60)
    print("Please verify the following:")
    print("  1. Wound mask (RED) covers the wound region")
    print("  2. Peri-wound mask (GREEN) forms a ring around the wound")
    print("  3. Peri-wound does NOT overlap wound (no yellow areas)")
    print("  4. Ring thickness is roughly ~20 pixels")
    print("  5. Mask looks reasonable (not perfect)")
    print("=" * 60)
    
    return True


if __name__ == "__main__":
    success = run_level1_and_level2_tests()
    
    print("\n" + "=" * 60)
    if success:
        print("[SUCCESS] LEVEL 1 & LEVEL 2 TESTING COMPLETE")
        print("   All functional assertions passed.")
        print("   Visual overlay generated for inspection.")
    else:
        print("[FAILED] TESTING FAILED")
        print("   Check the errors above.")
    print("=" * 60)
    
    sys.exit(0 if success else 1)
