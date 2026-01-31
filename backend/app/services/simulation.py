"""
Simulation Service

Provides hypothetical healing simulations based on visual measurements and patient metadata.
This module is for research purposes and does not provide clinical diagnoses.

Rules:
- Assumptions (multipliers) apply ONLY to simulation layer.
- Measurement layer remains untouched (ground truth).
- Linear trend extrapolation used for curves.
"""

from typing import List, Tuple
from ..schemas import MeasurementData, PatientMetadata, SimulationData, TrajectoryData

# Simulation Multipliers (Heuristic Research Values)
HEALING_RATE_MULTIPLIERS = {
    "smoking": 0.80,   # Slows healing by 20%
    "diabetes": 0.70,  # Slows healing by 30%
    "base_rate": 0.05  # Base Gilman linear rate (cm/day)
}

def run_hypothetical_simulation(
    measurement: MeasurementData, 
    metadata: PatientMetadata
) -> SimulationData:
    """
    Run a hypothetical simulation based on ground truth and metadata.
    Separates the simulated reference trajectory from the measured ground truth.
    """
    assumptions = []
    
    # 1. Calculate Velocity Multiplier (Research heuristics)
    velocity_multiplier = 1.0
    if metadata.is_smoker:
        velocity_multiplier *= HEALING_RATE_MULTIPLIERS["smoking"]
        assumptions.append("Smoking adjustment: -20% healing velocity")
        
    if metadata.has_diabetes:
        velocity_multiplier *= HEALING_RATE_MULTIPLIERS["diabetes"]
        assumptions.append("Diabetes adjustment: -30% healing velocity")
        
    # Scale adjustment (e.g., if a coin is present)
    simulated_area = measurement.area_cm2
    if metadata.has_reference_object:
        simulated_area = measurement.area_cm2 * 0.98 
        assumptions.append("Reference-normalized area (1-euro coin benchmark)")
    
    # 2. Simulate Reference Trajectory (Layer B)
    # We clone the ground-truth base expected curve and apply the multiplier
    sim_ref_curve = simulate_reference_curve(
        measurement.trajectory.expected, 
        velocity_multiplier
    )
    
    # 3. Implement Visual Trend Extrapolation (Layer B)
    # Extrapolate 3 steps into the future based on the simulated slope
    extrapolated = extrapolate_curve(sim_ref_curve, steps=3)
    
    # 4. Estimate completion window (Hypothetical)
    adjusted_rate = HEALING_RATE_MULTIPLIERS["base_rate"] * velocity_multiplier
    if adjusted_rate > 0:
        days_to_zero = simulated_area / (adjusted_rate * 2)
        min_days = days_to_zero * 0.8
        max_days = days_to_zero * 1.5
    else:
        min_days, max_days = 0, 0
        
    return SimulationData(
        enabled=True,
        assumptions_used=assumptions if assumptions else ["Base healing model (no metadata)"],
        simulated_area_cm2=round(simulated_area, 2),
        reference_curve=sim_ref_curve,
        extrapolated_curve=extrapolated,
        completion_window_days=[round(min_days, 1), round(max_days, 1)],
        confidence="LOW"
    )


def simulate_reference_curve(base_curve: List[float], velocity_multiplier: float) -> List[float]:
    """
    Compute a simulated reference curve based on assumptions.
    Apply multiplier to rate of change only, preserving the starting point.
    """
    if not base_curve:
        return []
    baseline = base_curve[0]
    return [
        round(baseline + (v - baseline) * velocity_multiplier, 2)
        for v in base_curve
    ]


def extrapolate_curve(curve: List[float], steps: int = 3) -> List[float]:
    """
    Add optional curve extension for visualization.
    Uses linear extrapolation of the last two points.
    """
    if len(curve) < 2:
        return curve
        
    slope = curve[-1] - curve[-2]
    ext_points = []
    for i in range(1, steps + 1):
        next_val = max(0.0, curve[-1] + slope * i)
        ext_points.append(round(next_val, 2))
    
    return curve + ext_points


def get_disabled_simulation(measurement: MeasurementData) -> SimulationData:
    """Return a simulation object when the layer is disabled."""
    return SimulationData(
        enabled=False,
        assumptions_used=[],
        simulated_area_cm2=measurement.area_cm2,
        reference_curve=[],
        extrapolated_curve=[],
        completion_window_days=[0.0, 0.0],
        confidence="LOW"
    )
