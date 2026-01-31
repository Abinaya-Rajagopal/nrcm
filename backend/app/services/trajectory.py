"""
Trajectory Service

Stub for healing trajectory prediction and comparison.
Will integrate time-series analysis in the future.

⚠️ NO REAL PREDICTION LOGIC YET - Returns mock data only.
"""

from typing import Dict, Any, List


def get_mock_trajectory() -> Dict[str, Any]:
    """
    Return mock trajectory data.
    
    Future implementation will compute expected healing curves.
    
    Returns:
        Dict containing mock trajectory values.
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
    healing_rate: float = 0.1
) -> List[float]:
    """
    Stub for expected healing trajectory calculation.
    
    Args:
        initial_area: Starting wound area in cm²
        days: Number of days to project
        healing_rate: Expected daily reduction rate
        
    Returns:
        List of expected area values (currently mock)
        
    TODO:
        - Implement exponential decay model
        - Consider wound type and patient factors
    """
    # NOT IMPLEMENTED - Return mock
    return [12.0, 10.8, 9.7, 8.7, 7.8]


def compare_trajectories(expected: List[float], actual: List[float]) -> Dict[str, Any]:
    """
    Stub for trajectory comparison and alert generation.
    
    Args:
        expected: Expected healing trajectory
        actual: Actual observed trajectory
        
    Returns:
        Comparison result with risk assessment
        
    TODO:
        - Calculate deviation metrics
        - Generate appropriate alerts
    """
    # NOT IMPLEMENTED - Return mock
    return {
        "deviation_pct": 15.2,
        "stall_detected": True,
        "alert_reason": "Healing stalled for 2 days"
    }


def analyze_trajectory(current_metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrate trajectory analysis based on current metrics.
    
    Args:
        current_metrics: Dictionary containing current area, redness, etc.
        
    Returns:
        Dict containing risk_level, trajectory data, and alert_reason
    """
    # Real implementation would:
    # 1. Fetch historical data for this patient/wound
    # 2. Append current_method['area_cm2'] to history
    # 3. Calculate expected trajectory
    # 4. Compare and determine risk
    
    # Mocking the flow:
    current_area = current_metrics.get("area_cm2", 12.4)
    expected_curve = calculate_expected_trajectory(current_area)
    
    # We use fixed mock data for 'actual' in this stub
    actual_curve = [12.0, 11.5, 11.3, 11.2, 11.2]
    
    comparison = compare_trajectories(expected_curve, actual_curve)
    
    return {
        "risk_level": "AMBER",  # Derived from comparison
        "trajectory": {
            "expected": expected_curve,
            "actual": actual_curve
        },
        "alert_reason": comparison.get("alert_reason")
    }
