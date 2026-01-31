"""
Test script for wound segmentation module.
Tests demo fallback mode with sample images.
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import cv2
from app.services.segmentation import segment_wound, get_mock_segmentation


def test_demo_fallback():
    """Test that demo fallback generates valid circular masks."""
    print("=" * 60)
    print("TEST: Demo Fallback Mode")
    print("=" * 60)
    
    # Create a simple test image
    image = np.zeros((480, 640, 3), dtype=np.uint8)
    image[:, :] = [200, 180, 160]  # Skin-like color
    
    point = (320, 240)  # Center of image
    
    # Run segmentation in demo mode
    result = segment_wound(image, point, demo_mode=True)
    
    # Validate output structure
    assert 'wound_mask' in result, "Missing 'wound_mask' key"
    assert 'peri_wound_mask' in result, "Missing 'peri_wound_mask' key"
    
    wound_mask = result['wound_mask']
    peri_wound_mask = result['peri_wound_mask']
    
    # Validate mask shapes
    assert wound_mask.shape == (480, 640), f"Wrong wound_mask shape: {wound_mask.shape}"
    assert peri_wound_mask.shape == (480, 640), f"Wrong peri_wound_mask shape: {peri_wound_mask.shape}"
    
    # Validate mask dtypes
    assert wound_mask.dtype == np.uint8, f"Wrong wound_mask dtype: {wound_mask.dtype}"
    assert peri_wound_mask.dtype == np.uint8, f"Wrong peri_wound_mask dtype: {peri_wound_mask.dtype}"
    
    # Validate masks are binary
    assert set(np.unique(wound_mask)).issubset({0, 1}), "wound_mask is not binary"
    assert set(np.unique(peri_wound_mask)).issubset({0, 1}), "peri_wound_mask is not binary"
    
    # Validate masks are not empty
    assert np.sum(wound_mask) > 0, "wound_mask is empty"
    assert np.sum(peri_wound_mask) > 0, "peri_wound_mask is empty"
    
    # Validate peri-wound is a ring (no overlap with wound)
    overlap = np.sum(wound_mask & peri_wound_mask)
    assert overlap == 0, f"Masks overlap by {overlap} pixels"
    
    print(f"  Wound mask pixels: {np.sum(wound_mask)}")
    print(f"  Peri-wound pixels: {np.sum(peri_wound_mask)}")
    print("  PASSED")
    print()
    
    return True


def test_with_demo_image():
    """Test segmentation with actual demo images."""
    print("=" * 60)
    print("TEST: Demo Image Processing")
    print("=" * 60)
    
    demo_dir = os.path.join(
        os.path.dirname(__file__), 
        'demo_assets', 'wound_images', 'primary'
    )
    
    if not os.path.exists(demo_dir):
        print(f"  Demo directory not found: {demo_dir}")
        print("  SKIPPED")
        return True
    
    images = [f for f in os.listdir(demo_dir) if f.endswith('.jpg')]
    
    if not images:
        print("  No demo images found")
        print("  SKIPPED")
        return True
    
    for img_name in images[:3]:  # Test first 3 images
        img_path = os.path.join(demo_dir, img_name)
        image = cv2.imread(img_path)
        
        if image is None:
            print(f"  Failed to load: {img_name}")
            continue
        
        # Convert BGR to RGB
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Use center of image as point
        h, w = image.shape[:2]
        point = (w // 2, h // 2)
        
        # Run segmentation
        result = segment_wound(image, point, demo_mode=True)
        
        wound_mask = result['wound_mask']
        peri_wound_mask = result['peri_wound_mask']
        
        print(f"  {img_name}:")
        print(f"    Image size: {image.shape[:2]}")
        print(f"    Wound pixels: {np.sum(wound_mask)}")
        print(f"    Peri-wound pixels: {np.sum(peri_wound_mask)}")
        
        # Validate
        assert wound_mask.shape == (h, w), "Mask shape mismatch"
        assert np.sum(wound_mask) > 0, "Empty wound mask"
    
    print("  PASSED")
    print()
    return True


def test_determinism():
    """Test that segmentation produces consistent results."""
    print("=" * 60)
    print("TEST: Determinism")
    print("=" * 60)
    
    image = np.random.randint(0, 255, (300, 400, 3), dtype=np.uint8)
    point = (200, 150)
    
    # Run multiple times
    results = []
    for i in range(3):
        result = segment_wound(image, point, demo_mode=True)
        results.append(result['wound_mask'].copy())
    
    # Check all results are identical
    for i in range(1, len(results)):
        if not np.array_equal(results[0], results[i]):
            print("  FAILED: Results differ between runs")
            return False
    
    print("  All 3 runs produced identical results")
    print("  PASSED")
    print()
    return True


def test_mock_metadata():
    """Test legacy mock metadata function."""
    print("=" * 60)
    print("TEST: Legacy Mock Metadata")
    print("=" * 60)
    
    result = get_mock_segmentation()
    
    assert 'mask_available' in result
    assert 'method' in result
    
    print(f"  Result: {result}")
    print("  PASSED")
    print()
    return True


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("WOUND SEGMENTATION MODULE TESTS")
    print("=" * 60 + "\n")
    
    all_passed = True
    
    all_passed &= test_demo_fallback()
    all_passed &= test_with_demo_image()
    all_passed &= test_determinism()
    all_passed &= test_mock_metadata()
    
    print("=" * 60)
    if all_passed:
        print("ALL TESTS PASSED")
    else:
        print("SOME TESTS FAILED")
    print("=" * 60)
