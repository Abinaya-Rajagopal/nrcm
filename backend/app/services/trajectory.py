"""
Trajectory Service

Handles healing prediction, trajectory comparison, and risk assessment.
Designed to receive metrics from the upstream pipeline (Person 2/3).
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
    - Day-1 area is used as the baseline for projecting healing progress.
    - Assumes roughly 10% wound area reduction per day, compounding over time.
    - This creates a smooth, monotonically decreasing healing curve.
    
    Args:
        initial_area: Starting wound area in cm² (Day-1 area)
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
        return {"deviation_pct": 0.0, "trend_pct": 0.0}
        
    current_expected = expected[len(actual) - 1] if len(actual) <= len(expected) else expected[-1]
    current_actual = actual[-1]
    
    # Calculate deviation percentage (positive = actual is larger than expected = worse)
    if current_expected > 0:
        deviation_pct = ((current_actual - current_expected) / current_expected) * 100.0
    else:
        deviation_pct = 0.0
    
    # Calculate trend over last 2 days (positive = area increasing = worsening)
    if len(actual) >= 2:
        prev_area = actual[-2]
        if prev_area > 0:
            trend_pct = ((current_actual - prev_area) / prev_area) * 100.0
        else:
            trend_pct = 0.0
    else:
        trend_pct = 0.0  # Not enough data for trend
        
    return {
        "deviation_pct": round(deviation_pct, 1),
        "trend_pct": round(trend_pct, 1)
    }


def analyze_trajectory(
    area_history: List[float],
    segmentation_mode: str = "normal"
) -> Dict[str, Any]:
    """
    Orchestrate trajectory analysis based on pipeline metrics.
    
    This function is the primary entry point for Person-1 (Orchestrator) integration.
    It takes the area_cm2 values across days and the segmentation mode from the metrics pipeline.
    
    Args:
        area_history: List of area_cm2 values from Day-1 onwards. 
                      Day-1 area is used as the baseline for expected curve.
        segmentation_mode: "normal" or "fallback" (from metrics pipeline).
        
    Returns:
        Dict containing trajectory_status, risk_level, trajectory data, alert flag, and reason.
    
    IMPORTANT - Fallback Mode Handling:
    If segmentation_mode == "fallback", the area metrics are considered unreliable.
    In this case, we skip all trajectory deviation and risk logic to avoid false alerts.
    This is because fallback segmentation may produce constant or inaccurate area values
    that do not reflect true clinical status.
    """
    
    # --- Fallback Mode: Skip Risk Assessment ---
    # WHY: Fallback segmentation uses a less accurate method.
    # Constant or stalled area_cm2 in fallback is NOT a clinical signal.
    # Raising alerts would mislead clinicians. We return a safe, neutral result.
    if segmentation_mode == "fallback":
        return {
            "trajectory_status": "indeterminate",
            "risk_level": None,
            "trajectory": {
                "expected": [],
                "actual": area_history if area_history else []
            },
            "alert": False,
            "reason": "Segmentation fallback mode; area metrics unreliable"
        }
    
    # --- Normal Mode: Full Trajectory Analysis ---
    if not area_history or len(area_history) == 0:
        return {
            "trajectory_status": "insufficient_data",
            "risk_level": RISK_GREEN,
            "trajectory": {"expected": [], "actual": []},
            "alert": False,
            "reason": "Not enough data for trajectory analysis"
        }
    
    # Day-1 area is the baseline for expected healing curve
    initial_area = area_history[0]
    num_days = len(area_history)
    
    # Calculate expected trajectory based on Day-1 area
    expected_curve = calculate_expected_trajectory(initial_area, days=num_days)
    
    # Actual trajectory is the area_history from the pipeline
    actual_curve = area_history
    
    # Compare trajectories to get deviation and trend
    comparison = compare_trajectories(expected_curve, actual_curve)
    deviation_pct = comparison.get("deviation_pct", 0.0)
    trend_pct = comparison.get("trend_pct", 0.0)
    
    # Calculate risk level based on deviation and trend
    risk_level, alert_reason = calculate_risk_level(deviation_pct, trend_pct)
    
    # Determine if an alert should be raised
    alert = risk_level in [RISK_AMBER, RISK_RED]
    
    return {
        "trajectory_status": "analyzed",
        "risk_level": risk_level,
        "trajectory": {
            "expected": expected_curve,
            "actual": actual_curve
        },
        "alert": alert,
        "reason": alert_reason
    }
