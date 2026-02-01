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

from ..services.session import get_history, get_baseline_area

# ... (imports)

def build_frontend_response(
    image_rgb: np.ndarray,
    wound_mask: np.ndarray,
    peri_mask: np.ndarray,
    metadata: Optional[PatientMetadata],
    demo_mode: bool,
    fallback_used: bool,
    enable_simulation: bool = True,
    session_id: str = "default"
) -> AnalyzeResponse:
    """
    Adapter function that collects outputs and packages them into the stable response schema.
    Guarantees schema stability and prevents empty trajectories.
    """
    
    # 1. Measurement (Layer A) - Ground Truth
    metrics_data = get_debug_metrics(image_rgb, wound_mask, peri_mask)
    current_area = metrics_data['area_cm2']

    # Rule 8: Guardrails - Validate Inference Outputs
    # Fail loudly if critical metrics are missing or invalid
    if None in [current_area, metrics_data['redness_pct'], metrics_data['pus_pct']] or \
       np.isnan(current_area) or np.isnan(metrics_data['redness_pct']):
         raise ValueError("CRITICAL: Inference pipeline produced invalid/missing metrics.")
    
    # MULTI-DAY TRAJECTORY LOGIC
    # Retrieve full history including the measurement we just added
    history = get_history(session_id)
    
    # Construct "Actual" trajectory from history
    actual = [obs["area"] for obs in history]
    
    # Construct "Expected" trajectory (Baseline -> Target)
    # Using Gilman Linear Model from trajectory service
    baseline = get_baseline_area(session_id)
    
    # If we have history, project for at least the current length
    # Ensure we show at least 5 days for visualization context if early
    days_to_project = max(len(actual), 5)
    
    expected = calculate_expected_trajectory(initial_area=baseline, days=days_to_project)
    
    # Get previous area for risk calc (Day N-1)
    if len(actual) > 1:
        prev_area = actual[-2]
    else:
        prev_area = current_area # Day 1
    
    # Calculate Risk based on LATEST change
    # RULE 6: Re-enable Baseline Logic (Correctly)
    # If only one observation (Day 1), enforce 0 delta/change
    if len(actual) == 1:
        prev_area = current_area
        risk_assessment = {
             "risk_level": "GREEN", 
             "alert_reasons": [],
             "logic": "Baseline established."
        }
        # Enforce Day 1 zero-change rule
        metrics_data['redness_pct'] = float(metrics_data['redness_pct']) # Ensure float
        metrics_data['pus_pct'] = float(metrics_data['pus_pct'])
    else:
        # Normal comparison logic
        prev_area = actual[-2]
        risk_assessment = determine_risk_level(
            current_area=current_area,
            previous_area=prev_area,
            redness_pct=metrics_data['redness_pct'],
            pus_pct=metrics_data['pus_pct']
        )
    
    trajectory = TrajectoryData(expected=expected, actual=actual)
    
    # Deviation Calculation: actual[-1] - expected[day_index]
    # Ensure indices align
    current_day_idx = len(actual) - 1
    if current_day_idx < len(expected) and len(actual) > 1:
        target_today = expected[current_day_idx]
        deviation = round(current_area - target_today, 2)
    else:
        # Day 1 or out of bounds -> 0 deviation
        deviation = 0.0
    
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
        day_index=len(actual),
        observation_count=len(actual)
    )
    
    return AnalyzeResponse(
        measurement=measurement,
        simulation=simulation,
        limitations=LIMITATIONS,
        flags=flags,
        metadata=res_metadata
    )
