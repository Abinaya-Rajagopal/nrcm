"""
Heatmap Visual Test

Generates visual demonstrations of all three heatmap types using real wound images.
This tests the heatmaps with actual segmentation masks from the segment_wound function.

Test outputs:
1. Redness Heatmap overlay (peri-wound)
2. Exudate Heatmap overlay (wound bed)
3. Change Heatmap (simulated day-to-day)
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
    apply_heatmap_overlay,
    apply_change_heatmap_overlay,
    should_generate_heatmaps
)


def run_heatmap_visual_test():
    """Run visual test for all three heatmap types."""
    
    print("=" * 60)
    print("HEATMAP VISUAL TEST")
    print("=" * 60)
    
    # ========================================
    # STEP 1: Load image and get segmentation
    # ========================================
    print("\n[STEP 1] Loading demo image and segmentation...")
    
    image_path = os.path.join(
        os.path.dirname(__file__),
        "demo_assets", "wound_images", "primary", "demo_01.jpg"
    )
    
    if not os.path.exists(image_path):
        print(f"  ERROR: Image not found at {image_path}")
        return False
    
    # Load and convert to RGB
    image_bgr = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    height, width = image_rgb.shape[:2]
    
    print(f"  Image loaded: {width}x{height}")
    
    # Get segmentation masks
    point = (width // 2, height // 2)
    seg_result = segment_wound(image_rgb, point, demo_mode=False)
    
    wound_mask = seg_result["wound_mask"]
    peri_wound_mask = seg_result["peri_wound_mask"]
    combined_mask = np.clip(wound_mask + peri_wound_mask, 0, 1).astype(np.uint8)
    
    print(f"  Wound pixels: {np.sum(wound_mask)}")
    print(f"  Peri-wound pixels: {np.sum(peri_wound_mask)}")
    print("  [OK] Segmentation complete")
    
    # ========================================
    # STEP 2: Generate all heatmaps
    # ========================================
    print("\n[STEP 2] Generating heatmaps...")
    
    # Redness heatmap (peri-wound)
    redness_heatmap = generate_redness_heatmap(image_rgb, peri_wound_mask)
    print(f"  Redness heatmap: min={np.min(redness_heatmap):.3f}, max={np.max(redness_heatmap):.3f}")
    
    # Exudate heatmap (wound bed)
    exudate_heatmap = generate_exudate_heatmap(image_rgb, wound_mask)
    print(f"  Exudate heatmap: min={np.min(exudate_heatmap):.3f}, max={np.max(exudate_heatmap):.3f}")
    
    # Change heatmap (simulate day-to-day with slight variation)
    # For demo, we'll create a simulated "previous day" by slightly modifying the redness
    redness_prev = redness_heatmap.copy()
    # Simulate improvement in some areas, worsening in others
    np.random.seed(42)  # For reproducibility
    noise = np.random.randn(*redness_heatmap.shape).astype(np.float32) * 0.1
    redness_prev = np.clip(redness_heatmap - noise * 0.5, 0, 1)
    
    change_heatmap = generate_change_heatmap(redness_prev, redness_heatmap, combined_mask)
    print(f"  Change heatmap: min={np.min(change_heatmap):.3f}, max={np.max(change_heatmap):.3f}")
    print("  [OK] All heatmaps generated")
    
    # ========================================
    # STEP 3: Create visualization overlays
    # ========================================
    print("\n[STEP 3] Creating overlay visualizations...")
    
    # Apply overlays
    redness_overlay = apply_heatmap_overlay(
        image_rgb, redness_heatmap, 
        colormap="hot", alpha=0.6, mask=peri_wound_mask
    )
    
    exudate_overlay = apply_heatmap_overlay(
        image_rgb, exudate_heatmap,
        colormap="hot", alpha=0.6, mask=wound_mask
    )
    
    change_overlay = apply_change_heatmap_overlay(
        image_rgb, change_heatmap,
        alpha=0.6, mask=combined_mask
    )
    
    print("  [OK] Overlays created")
    
    # ========================================
    # STEP 4: Create comprehensive figure
    # ========================================
    print("\n[STEP 4] Generating visualization figure...")
    
    fig, axes = plt.subplots(2, 4, figsize=(20, 10))
    
    # Row 1: Original, Masks, Redness Raw, Exudate Raw
    axes[0, 0].imshow(image_rgb)
    axes[0, 0].set_title("Original Image", fontsize=12)
    axes[0, 0].axis('off')
    
    # Masks visualization
    mask_viz = np.zeros((height, width, 3), dtype=np.uint8)
    mask_viz[wound_mask == 1] = [255, 0, 0]  # Red for wound
    mask_viz[peri_wound_mask == 1] = [0, 255, 0]  # Green for peri-wound
    axes[0, 1].imshow(mask_viz)
    axes[0, 1].set_title("Masks (Red=Wound, Green=Peri-wound)", fontsize=12)
    axes[0, 1].axis('off')
    
    # Redness heatmap raw
    im1 = axes[0, 2].imshow(redness_heatmap, cmap='hot', vmin=0, vmax=1)
    axes[0, 2].set_title("Redness Heatmap (Peri-wound)\nMetric-derived", fontsize=12)
    axes[0, 2].axis('off')
    plt.colorbar(im1, ax=axes[0, 2], fraction=0.046, pad=0.04)
    
    # Exudate heatmap raw
    im2 = axes[0, 3].imshow(exudate_heatmap, cmap='YlOrRd', vmin=0, vmax=1)
    axes[0, 3].set_title("Exudate Heatmap (Wound bed)\nMetric-derived", fontsize=12)
    axes[0, 3].axis('off')
    plt.colorbar(im2, ax=axes[0, 3], fraction=0.046, pad=0.04)
    
    # Row 2: Redness Overlay, Exudate Overlay, Change Raw, Change Overlay
    axes[1, 0].imshow(redness_overlay)
    axes[1, 0].set_title("Redness Overlay\nHigher = more inflammation", fontsize=12)
    axes[1, 0].axis('off')
    
    axes[1, 1].imshow(exudate_overlay)
    axes[1, 1].set_title("Exudate Overlay\nHigher = more exudate color", fontsize=12)
    axes[1, 1].axis('off')
    
    # Change heatmap with diverging colormap
    im3 = axes[1, 2].imshow(change_heatmap, cmap='RdYlGn_r', vmin=-1, vmax=1)
    axes[1, 2].set_title("Change Heatmap (Day-to-Day)\nGreen=Healing, Red=Worsening", fontsize=12)
    axes[1, 2].axis('off')
    plt.colorbar(im3, ax=axes[1, 2], fraction=0.046, pad=0.04)
    
    axes[1, 3].imshow(change_overlay)
    axes[1, 3].set_title("Change Overlay\nGreen=Improvement, Red=Worsening", fontsize=12)
    axes[1, 3].axis('off')
    
    plt.suptitle(
        "Wound Heatmap Visualizations - Metric-Derived Explanations\n"
        "(NOT ML attention maps - highlights regions contributing to metrics)",
        fontsize=14, fontweight='bold'
    )
    plt.tight_layout()
    
    # Save the visualization
    output_path = os.path.join(
        os.path.dirname(__file__),
        "test_heatmap_visualization.png"
    )
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close(fig)
    
    print(f"\n  Visualization saved to: {output_path}")
    
    # ========================================
    # STEP 5: Test fallback protection
    # ========================================
    print("\n[STEP 5] Testing fallback protection...")
    
    assert should_generate_heatmaps("mobilesam") == True, "Should allow MobileSAM"
    assert should_generate_heatmaps("fallback") == False, "Should block fallback"
    assert should_generate_heatmaps("demo") == False, "Should block demo"
    
    print("  [PASS] Fallback protection working correctly")
    print("         - mobilesam: heatmaps ALLOWED")
    print("         - fallback: heatmaps BLOCKED")
    print("         - demo: heatmaps BLOCKED")
    
    print("\n" + "=" * 60)
    print("[SUCCESS] HEATMAP VISUAL TEST COMPLETE")
    print("=" * 60)
    print("\nVisual outputs generated:")
    print(f"  - {output_path}")
    print("\nAll three heatmap types are working:")
    print("  1. Redness Heatmap (peri-wound inflammation)")
    print("  2. Exudate Heatmap (wound bed concentration)")
    print("  3. Change Heatmap (day-to-day progression)")
    print("\nSafety rules enforced:")
    print("  - No heatmaps on fallback/demo masks")
    print("  - All visualizations are metric-derived, NOT ML attention")
    
    return True


if __name__ == "__main__":
    success = run_heatmap_visual_test()
    sys.exit(0 if success else 1)
