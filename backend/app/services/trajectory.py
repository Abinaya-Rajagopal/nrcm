"""
Trajectory Service

Handles healing prediction, trajectory comparison, and risk assessment.
"""

from typing import Dict, Any, List, Optional, Tuple

# Risk Level Constants
RISK_GREEN = "GREEN"
RISK_AMBER = "AMBER"
RISK_RED = "RED"

# Thresholds (Defined in shared/constants.md > Trajectory Deviation)
DEVIATION_THRESHOLD_AMBER = 10.0
DEVIATION_THRESHOLD_RED = 20.0

# Thresholds (Defined in shared/constants.md > Area Change)
TREND_THRESHOLD_STALLED = -5.0
TREND_THRESHOLD_WORSENING = 0.0


def get_mock_trajectory() -> Dict[str, Any]:
    """
    Return mock trajectory data for DEMO_MODE.
    """
    return {
        "expected": [12.0, 10.8, 9.7, 8.7, 7.8],
        "actual": [12.0, 11.5, 11.3, 11.2, 11.2],
        "method": "mock",
        "note": "Real trajectory analysis not yet implemented"
    }


def calculate_expected_trajectory(
    initial_area: float,
    days: int = 5,
    healing_rate: float = 0.10
) -> List[float]:
    """
    Calculate expected healing trajectory.
    
    Logic:
    - Assumes roughly 10% wound area reduction per day, compounding over time for larger wounds.
    - This creates a standard standard smooth healing curve.
    
    Args:
        initial_area: Starting wound area in cm²
        days: Number of days to project
        healing_rate: Daily reduction rate (default 0.10)
        
    Returns:
        List of expected area values.
    """
    trajectory = []
    for t in range(days):
        # Applies the daily reduction rate compounded for each day
        area_t = initial_area * ((1 - healing_rate) ** t)
        trajectory.append(round(area_t, 1))
    return trajectory


def calculate_risk_level(
    deviation_pct: float,
    trend_pct: float
) -> Tuple[str, Optional[str]]:
    """
    Determine risk level based on Area Deviation and Trend.
    
    Inputs:
    - deviation_pct: % difference between Actual and Expected (positive = worse)
    - trend_pct: % change in Actual area over last 2 days (positive = increasing/worsening)
    
    Logic (Sources: shared/constants.md):
    - RED: Wound is worsening (Trend > 0%) OR deviates significantly from expected (> 20%)
    - AMBER: Healing has stalled (Trend -5% to 0%) OR deviates mildly (> 10%)
    - GREEN: Healing is progressing well (Trend < -5%) AND matches expectations
    
    Returns:
        Tuple of (Risk Level, Alert Reason)
    """
    
    # 1. Check Critical Failure (RED)
    if trend_pct > TREND_THRESHOLD_WORSENING:
        return RISK_RED, "Wound area increased over the last 2 days"
    
    if deviation_pct > DEVIATION_THRESHOLD_RED:
        return RISK_RED, "Wound area significantly larger than expected"

    # 2. Check Warning Signs (AMBER)
    if TREND_THRESHOLD_STALLED <= trend_pct <= TREND_THRESHOLD_WORSENING:
        return RISK_AMBER, "Healing stalled (minimal area reduction)"
        
    if deviation_pct > DEVIATION_THRESHOLD_AMBER:
        return RISK_AMBER, "Healing progress is slower than expected"

    # 3. Default (GREEN)
    return RISK_GREEN, "Healing is progressing as expected"


def compare_trajectories(
    expected: List[float],
    actual: List[float]
) -> Dict[str, Any]:
    """
    Compare expected vs actual trajectory.
    """
    if not expected or not actual:
        return {}
        
    current_expected = expected[-1]
    current_actual = actual[-1]
    
    # Calculate deviation percentage
    if current_expected > 0:
        deviation_pct = ((current_actual - current_expected) / current_expected) * 100.0
    else:
        deviation_pct = 0.0
        
    return {
        "deviation_pct": round(deviation_pct, 1),
        "current_diff": round(current_actual - current_expected, 1)
    }
