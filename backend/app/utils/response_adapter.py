"""
Response Adapter Module

Stabilizes the integration between backend logic and the frontend by
assembling a predictable JSON schema.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import numpy as np

from ..schemas import (
    AnalyzeResponse,
    MeasurementData,
    SimulationData,
    AnalysisFlags,
    ResearchMetadata,
    TrajectoryData,
    PatientMetadata
)
from ..services.metrics import get_debug_metrics
from ..services.trajectory import (
    calculate_expected_trajectory,
    determine_risk_level
)
from ..services.simulation import run_hypothetical_simulation

# Static limitations documentation for the frontend
LIMITATIONS = [
    "Single-image analysis per capture",
    "No explicit image registration across observations",
    "Lighting normalized, not fully corrected",
    "Simulation outputs have LOW confidence"
]

def build_frontend_response(
    image_rgb: np.ndarray,
    wound_mask: np.ndarray,
    peri_mask: np.ndarray,
    metadata: Optional[PatientMetadata],
    demo_mode: bool,
    fallback_used: bool,
    enable_simulation: bool = True
) -> AnalyzeResponse:
    """
    Adapter function that collects outputs and packages them into the stable response schema.
    Guarantees schema stability and prevents empty trajectories.
    """
    
    # 1. Measurement (Layer A) - Ground Truth
    metrics_data = get_debug_metrics(image_rgb, wound_mask, peri_mask)
    current_area = metrics_data['area_cm2']
    
    # Day 1 / Baseline Logic
    # We treat every new upload as the anchoring "Day 1" observation.
    # This establishes the baseline for all future comparisons.
    
    # Calculate Risk (Static Analysis only for Day 1)
    risk_assessment = determine_risk_level(
        current_area=current_area,
        previous_area=current_area, # No history yet
        redness_pct=metrics_data['redness_pct'],
        pus_pct=metrics_data['pus_pct']
    )
    
    # Generate Forward-Looking Trajectory (Forecast)
    # create a 7-day expected healing curve starting from today
    expected = [round(current_area * (0.9 ** i), 2) for i in range(7)]
    
    # Actual data is just today
    actual = [current_area]
    
    trajectory = TrajectoryData(expected=expected, actual=actual)
    
    # Deviation Calculation: actual[-1] - expected[-1]
    deviation = round(actual[-1] - expected[-1], 2)
    
    alert_reason = risk_assessment["alert_reasons"][0] if risk_assessment["alert_reasons"] else None
    
    # Rule 2: Ensure alert_reason is ALWAYS present when risk ≠ GREEN
    if risk_assessment["risk_level"] != "GREEN" and not alert_reason:
        alert_reason = "Wound monitoring indicates visual deviation from expected trend"
        
    measurement = MeasurementData(
        area_cm2=current_area,
        redness_pct=metrics_data['redness_pct'],
        pus_pct=metrics_data['pus_pct'],
        risk_level=risk_assessment["risk_level"],
        trajectory=trajectory,
        alert_reason=alert_reason,
        deviation_cm2=deviation
    )
    
    # 2. Simulation (Layer B) - Hypothetical
    # Rule 4: Support requests to disable simulation (Reset to Measured View)
    simulation = None
    if enable_simulation and metadata:
        simulation = run_hypothetical_simulation(measurement, metadata)
        simulation.enabled = True
        
    # 3. Flags
    flags = AnalysisFlags(
        demo_mode=demo_mode,
        fallback_segmentation=fallback_used,
        research_mode=True
    )
    
    # 4. Metadata
    res_metadata = ResearchMetadata(
        analysis_id=str(uuid.uuid4()),
        captured_at=datetime.utcnow().isoformat() + "Z",
        day_index=1,
        observation_count=len(actual)
    )
    
    return AnalyzeResponse(
        measurement=measurement,
        simulation=simulation,
        limitations=LIMITATIONS,
        flags=flags,
        metadata=res_metadata
    )
