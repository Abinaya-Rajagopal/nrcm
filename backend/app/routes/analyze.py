"""
Analyze Endpoint

Provides wound analysis functionality.
Currently returns MOCK DATA only when DEMO_MODE is enabled.

⚠️ No real ML/CV logic implemented yet.
"""

from fastapi import APIRouter, HTTPException
from ..config import DEMO_MODE
from ..schemas import AnalyzeRequest, AnalyzeResponse, TrajectoryData
from ..services.segmentation import get_mock_segmentation, segment_wound
from ..services.metrics import get_mock_metrics, calculate_metrics
from ..services.trajectory import get_mock_trajectory, analyze_trajectory

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post("", response_model=AnalyzeResponse)
async def analyze_wound(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyze a wound image and return metrics.
    
    Currently returns mock data only (DEMO_MODE).
    
    Returns:
        AnalyzeResponse: Wound metrics including area, redness, pus percentage,
                         risk level, trajectory, and any alerts.
    """
    if DEMO_MODE:
        # Return mock data for demo/development
        return _get_demo_response()
    else:
        # Real processing
        
        # 1. Segmentation
        segmentation_result = segment_wound(request.image_base64)
        
        # 2. Metrics (uses segmentation mask)
        metrics_result = calculate_metrics(segmentation_result)
        
        # 3. Trajectory (uses current metrics)
        trajectory_result = analyze_trajectory(metrics_result)
        
        # 4. Construct Response
        return AnalyzeResponse(
            area_cm2=metrics_result["area_cm2"],
            redness_pct=metrics_result["redness_pct"],
            pus_pct=metrics_result["pus_pct"],
            risk_level=trajectory_result["risk_level"],
            trajectory=TrajectoryData(
                expected=trajectory_result["trajectory"]["expected"],
                actual=trajectory_result["trajectory"]["actual"]
            ),
            alert_reason=trajectory_result.get("alert_reason")
        )


def _get_demo_response() -> AnalyzeResponse:
    """Generate mock response for demo mode."""
    # Get mock data from service stubs
    segmentation = get_mock_segmentation()
    metrics = get_mock_metrics()
    trajectory = get_mock_trajectory()
    
    return AnalyzeResponse(
        area_cm2=12.4,
        redness_pct=18.2,
        pus_pct=4.1,
        risk_level="AMBER",
        trajectory=TrajectoryData(
            expected=[12.0, 10.8, 9.7, 8.7, 7.8],
            actual=[12.0, 11.5, 11.3, 11.2, 11.2]
        ),
        alert_reason="Healing stalled for 2 days"
    )
