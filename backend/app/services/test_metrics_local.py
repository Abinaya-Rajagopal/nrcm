"""
Local-only verification for metrics heuristics.

Constraints:
- Do not modify API contract or locked files
- Do not commit this test script
- Use OpenCV + NumPy only

Run:
    python -m app.services.test_metrics_local
"""

import os
import importlib
from typing import Tuple

import cv2
import numpy as np

from app import config
import app.services.metrics as metrics


def _demo_image_path() -> str:
    here = os.path.dirname(__file__)
    backend_root = os.path.abspath(os.path.join(here, "..", ".."))
    return os.path.join(
        backend_root,
        "demo_assets",
        "wound_images",
        "primary",
        "demo_01.jpg",
    )


def _make_circle_mask(shape: Tuple[int, int], center: Tuple[int, int], radius: int) -> np.ndarray:
    mask = np.zeros(shape, dtype=np.uint8)
    cv2.circle(mask, center, radius, 255, thickness=-1)
    return mask


def _make_rect_mask(shape: Tuple[int, int], top_left: Tuple[int, int], bottom_right: Tuple[int, int]) -> np.ndarray:
    mask = np.zeros(shape, dtype=np.uint8)
    cv2.rectangle(mask, top_left, bottom_right, 255, thickness=-1)
    return mask


def _print_header(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def main() -> None:
    # Load demo image
    img_path = _demo_image_path()
    image_bgr = cv2.imread(img_path, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise RuntimeError(f"Failed to load demo image at {img_path}")

    h, w = image_bgr.shape[:2]
    print(f"Loaded image: {img_path} ({w}x{h})")

    # Create synthetic masks
    center = (w // 2, h // 2)
    wound_mask_small = _make_circle_mask((h, w), center, radius=min(w, h) // 10)
    wound_mask_large = _make_circle_mask((h, w), center, radius=min(w, h) // 6)
    peri_wound_mask = _make_rect_mask((h, w), (w // 4, h // 4), (3 * w // 4, 3 * h // 4))

    _print_header("Metric functions (standalone)")
    area_small = metrics.calculate_wound_area(wound_mask_small)
    area_large = metrics.calculate_wound_area(wound_mask_large)
    print(f"Area small: {area_small} cm^2")
    print(f"Area large: {area_large} cm^2")

    # Redness baseline vs induced redness
    redness_base = metrics.calculate_redness(image_bgr, peri_wound_mask)
    image_red = image_bgr.copy()
    # Draw a red rectangle inside peri-wound ROI to induce redness
    cv2.rectangle(image_red, (w // 3, h // 3), (w // 2, h // 2), (0, 0, 255), thickness=-1)
    redness_induced = metrics.calculate_redness(image_red, peri_wound_mask)
    print(f"Redness baseline: {redness_base}%")
    print(f"Redness induced:  {redness_induced}%")

    # Exudate baseline vs induced (white/yellow within wound)
    exudate_base = metrics.calculate_exudate(image_bgr, wound_mask_small)
    image_pus = image_bgr.copy()
    cv2.circle(image_pus, center, radius=min(w, h) // 12, color=(255, 255, 255), thickness=-1)
    exudate_induced = metrics.calculate_exudate(image_pus, wound_mask_small)
    print(f"Exudate baseline: {exudate_base}%")
    print(f"Exudate induced:  {exudate_induced}%")

    # Basic validations (non-failing prints)
    print("Validations:")
    print(f" - Area scales with mask size: {'OK' if area_large > area_small else 'CHECK'}")
    print(f" - Redness within [0,100]: {'OK' if 0.0 <= redness_base <= 100.0 and 0.0 <= redness_induced <= 100.0 else 'CHECK'}")
    print(f" - Exudate within [0,100]: {'OK' if 0.0 <= exudate_base <= 100.0 and 0.0 <= exudate_induced <= 100.0 else 'CHECK'}")

    _print_header("compute_metrics behavior (DEMO_MODE True)")
    # Ensure demo mode is True
    config.DEMO_MODE = True
    importlib.reload(metrics)
    demo_out = metrics.compute_metrics(image_bgr, wound_mask_small, peri_wound_mask)
    print("DEMO_MODE=True output:")
    print(demo_out)

    _print_header("compute_metrics behavior (DEMO_MODE False)")
    # Toggle to False and reload metrics so imported constant updates
    config.DEMO_MODE = False
    importlib.reload(metrics)
    real_out_small = metrics.compute_metrics(image_bgr, wound_mask_small, peri_wound_mask)
    real_out_large = metrics.compute_metrics(image_bgr, wound_mask_large, peri_wound_mask)
    print("DEMO_MODE=False output (small mask):")
    print(real_out_small)
    print("DEMO_MODE=False output (large mask):")
    print(real_out_large)

    print("Deterministic & bounded checks:")
    def _bounded(d):
        return (
            d["area_cm2"] >= 0.0
            and 0.0 <= d["redness_pct"] <= 100.0
            and 0.0 <= d["pus_pct"] <= 100.0
        )

    print(f" - Small mask bounded: {'OK' if _bounded(real_out_small) else 'CHECK'}")
    print(f" - Large mask bounded: {'OK' if _bounded(real_out_large) else 'CHECK'}")
    print(f" - Area increases with mask size: {'OK' if real_out_large['area_cm2'] > real_out_small['area_cm2'] else 'CHECK'}")


if __name__ == "__main__":
    main()
