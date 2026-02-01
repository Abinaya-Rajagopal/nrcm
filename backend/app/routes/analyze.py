"""
Analyze Endpoint

Provides wound analysis functionality for both production and research modes.
Supports layered responses separating visual measurement from hypothetical simulation.

⚠️ Safety constraints:
- Visual measurement is ground truth.
- Simulation is hypothetical and separate.
- No clinical diagnosis or point predictions.
"""

import os
import io
import base64
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

import numpy as np
from fastapi import APIRouter, HTTPException
from PIL import Image

from ..config import DEMO_MODE, DEMO_IMAGES_PRIMARY
from ..schemas import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    TrajectoryData,
    MeasurementData,
    SimulationData,
    AnalysisFlags,
    ResearchMetadata,
    DebugAnalyzeResponse,
    DebugInputInfo,
    DebugSegmentationInfo,
    DebugMetricsInfo,
    DebugHeatmapData
)
from ..services.segmentation import segment_wound
from ..services.metrics import get_debug_metrics
from ..services.trajectory import (
    calculate_expected_trajectory, 
    determine_risk_level
)
from ..services.heatmaps import (
    generate_redness_heatmap,
    generate_exudate_heatmap,
    apply_heatmap_overlay
)
from ..services.simulation import run_hypothetical_simulation
from ..services.session import add_observation
from ..utils.response_adapter import build_frontend_response

router = APIRouter(prefix="/analyze", tags=["Analysis"])


# ============================================================
# UTILITIES
# ============================================================

def _base64_to_numpy(b64_str: str) -> np.ndarray:
    """Decode base64 string to RGB numpy array."""
    try:
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        img_data = base64.b64decode(b64_str)
        img = Image.open(io.BytesIO(img_data))
        return np.array(img.convert('RGB'))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")


def _numpy_to_base64(img_np: np.ndarray, format: str = 'JPEG') -> str:
    """Encode numpy array to base64 string."""
    img = Image.fromarray(img_np)
    buffered = io.BytesIO()
    img.save(buffered, format=format)
    return base64.b64encode(buffered.getvalue()).decode()


def _get_demo_image() -> np.ndarray:
    """Load primary demo image for testing."""
    demo_path = os.path.join(os.path.dirname(__file__), "..", "..", DEMO_IMAGES_PRIMARY, "demo_01.jpg")
    if not os.path.exists(demo_path):
        return (np.random.rand(480, 640, 3) * 255).astype(np.uint8)
    img = Image.open(demo_path)
    return np.array(img.convert('RGB'))


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/health")
async def health_check():
    """Technical health check for infrastructure monitoring."""
    return {
        "status": "ok",
        "model_loaded": True,
        "simulation_enabled": True,
        "demo_mode": DEMO_MODE
    }


@router.post("", response_model=AnalyzeResponse)
async def analyze_wound(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Standard analysis endpoint with layered research structure.
    Separates ground truth measurement from hypothetical simulation.
    """
    try:
        if DEMO_MODE:
            return _get_demo_layered_response(request)

        # Execute full pipeline
        results = await _execute_core_pipeline(request)
        return results["results"]
    except Exception as e:
        # Rule 9: Controlled error handling
        return {
            "error": "Analysis failed",
            "reason": str(e) if DEMO_MODE else "Internal processing error",
            "flags": {"research_mode": True}
        }


@router.post("/debug", response_model=DebugAnalyzeResponse)
async def analyze_wound_debug(request: AnalyzeRequest) -> DebugAnalyzeResponse:
    """
    Comprehensive inference testing endpoint.
    Exposes every stage of the pipeline alongside the layered research result.
    """
    try:
        return await _execute_core_pipeline(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# CORE PIPELINE EXECUTION
# ============================================================

async def _execute_core_pipeline(request: AnalyzeRequest) -> Dict[str, Any]:
    """
    Internal engine for wound analysis and simulation.
    Executes visual pipeline and applies research simulation layers.
    """
    # 1. INPUT
    if request.use_demo_image or not request.image_base64:
        image_rgb = _get_demo_image()
    else:
        image_rgb = _base64_to_numpy(request.image_base64)
    
    h, w = image_rgb.shape[:2]
    utc_now = datetime.utcnow().isoformat() + "Z"

    # 2. SEGMENTATION (Ground Truth)
    center_point = (w // 2, h // 2)
    seg_result = segment_wound(image_rgb, center_point, demo_mode=DEMO_MODE)
    
    wound_mask = seg_result['wound_mask']
    peri_mask = seg_result['peri_wound_mask']
    fallback_flag = DEMO_MODE # Simplified for current logic
    
    # 3. ASSEMBLE ADAPTED RESPONSE
    # 3. ASSEMBLE ADAPTED RESPONSE
    # Store this observation in session history
    start_time = datetime.utcnow().isoformat()
    # Note: We duplicate metric extraction here slightly to get values for storage
    # In a full refactor, we would extract metrics once before this.
    debug_metrics = get_debug_metrics(image_rgb, wound_mask, peri_mask)
    
    session_id = request.session_id or "default_session"
    
    add_observation(
        session_id=session_id,
        area=debug_metrics['area_cm2'],
        redness=debug_metrics['redness_pct'],
        pus=debug_metrics['pus_pct']
    )
    
    # This adapter groups metrics, trajectory, risk, simulation, and metadata
    layered_response = build_frontend_response(
        image_rgb=image_rgb,
        wound_mask=wound_mask,
        peri_mask=peri_mask,
        metadata=request.metadata,
        demo_mode=DEMO_MODE,
        fallback_used=fallback_flag,
        enable_simulation=request.enable_simulation, # Rule 4: Toggle support
        session_id=session_id
    )
    
    # Rule 1: Schema validation assertion
    AnalyzeResponse.model_validate(layered_response)

    # 4. DEBUG EXTRAS (For Debug Endpoint)
    viz = image_rgb.copy()
    viz[wound_mask == 1] = viz[wound_mask == 1] * 0.5 + np.array([0, 255, 0]) * 0.5
    viz[peri_mask == 1] = viz[peri_mask == 1] * 0.5 + np.array([255, 0, 0]) * 0.5

    heatmap_info = DebugHeatmapData(enabled=False, reason="Disabled for visual safety")

    return {
        "results": layered_response,
        "input_debug": DebugInputInfo(
            resolution=f"{w}x{h}",
            timestamp=utc_now,
            day_index=1
        ),
        "segmentation": DebugSegmentationInfo(
            wound_mask_base64=_numpy_to_base64((wound_mask * 255).astype(np.uint8), format='PNG'),
            peri_wound_mask_base64=_numpy_to_base64((peri_mask * 255).astype(np.uint8), format='PNG'),
            combined_viz_base64=_numpy_to_base64(viz),
            used_model=not DEMO_MODE,
            fallback=fallback_flag
        ),
        "metrics": DebugMetricsInfo(
            area_cm2=layered_response.measurement.area_cm2,
            redness_pct=layered_response.measurement.redness_pct,
            pus_pct=layered_response.measurement.pus_pct,
            pixel_counts={}, 
            hsv_thresholds={}
        ),
        "heatmaps": heatmap_info
    }


def _get_demo_layered_response(request: AnalyzeRequest) -> AnalyzeResponse:
    """Mock layered response for demo mode via adapter logic."""
    # Create empty/mock masks for demo purposes to satisfy adapter
    mock_image = _get_demo_image()
    h, w = mock_image.shape[:2]
    mock_wound = np.zeros((h, w), dtype=np.uint8)
    mock_peri = np.zeros((h, w), dtype=np.uint8)
    
    # We use the adapter to ensure consistent schema even in demo mode
    response = build_frontend_response(
        image_rgb=mock_image,
        wound_mask=mock_wound,
        peri_mask=mock_peri,
        metadata=request.metadata,
        demo_mode=True,
        fallback_used=True,
        enable_simulation=request.enable_simulation
    )
    
    # Overwrite with hackathon-specific demo values for consistency with user docs
    response.measurement.area_cm2 = 12.4
    response.measurement.redness_pct = 18.2
    response.measurement.pus_pct = 4.1
    response.measurement.risk_level = "AMBER"
    response.measurement.alert_reason = "Healing rate slower than expected (stalled trajectory)"
    
    response.measurement.trajectory.expected = [12.0, 10.8, 9.7, 8.7, 7.8]
    response.measurement.trajectory.actual = [12.0, 11.5, 11.3, 11.2, 11.2]
    response.measurement.deviation_cm2 = round(response.measurement.trajectory.actual[-1] - response.measurement.trajectory.expected[-1], 2)
    response.metadata.observation_count = len(response.measurement.trajectory.actual)
    
    return response
