"""
Trajectory Service

Temporal reasoning and healing trajectory analysis.
Implements the Gilman model for expected healing curves and risk assessment logic.

⚠️ Assessment is purely trend-based and does not constitute a clinical diagnosis.
"""

import math
from typing import Dict, Any, List, Optional, Tuple, Literal
from ..config import RISK_THRESHOLDS

# Risk Level Constants
RISK_GREEN = "GREEN"
RISK_AMBER = "AMBER"
RISK_RED = "RED"


def calculate_expected_trajectory(
    initial_area: float,
    days: int = 5,
    linear_rate: float = 0.05
) -> List[float]:
    """
    Calculate expected healing trajectory using the Gilman Model.
    The Gilman Model assumes the wound boundary moves inward at a constant linear rate.
    """
    if initial_area <= 0:
        return [0.0] * days
        
    # Initial equivalent radius assuming circular wound
    r0 = math.sqrt(initial_area / math.pi)
    
    trajectory = []
    for t in range(days):
        # Current radius
        rt = max(0, r0 - (linear_rate * t))
        # Current area
        at = rt * rt * math.pi
        trajectory.append(round(at, 2))
        
    return trajectory


def determine_risk_level(
    current_area: float,
    previous_area: float,
    redness_pct: float,
    pus_pct: float
) -> Dict[str, Any]:
    """
    Assesses risk level based on heuristic thresholds.
    """
    reasons = []
    
    # Calculate area change percentage
    if previous_area > 0:
        area_change = ((current_area - previous_area) / previous_area) * 100
    else:
        area_change = 0.0

    # Risk level determination logic (cascading)
    level: Literal["GREEN", "AMBER", "RED"] = "GREEN"
    
    # 1. Check RED criteria (Critical)
    if area_change > RISK_THRESHOLDS["RED"]["area_change_pct"]:
        level = "RED"
        reasons.append(f"Wound area increased by {area_change:.1f}% (regression)")
    
    # Priority: High inflammation/redness is a critical signal (Person 2 clinical rule)
    if redness_pct > RISK_THRESHOLDS["RED"]["redness_max"] or redness_pct > 40:
        level = "RED"
        reasons.append(f"Severe inflammation/bruising detected ({redness_pct}%)")
        
    if pus_pct > 15: # Custom red threshold for pus
        level = "RED"
        reasons.append(f"High exudate concentration ({pus_pct}%)")

    # 2. Check AMBER criteria (Warning) - Only if not already RED
    if level != "RED":
        if area_change > RISK_THRESHOLDS["AMBER"]["area_change_pct"]:
            level = "AMBER"
            reasons.append("Healing rate is slower than expected (stalled trajectory)")
            
        if redness_pct > RISK_THRESHOLDS["GREEN"]["redness_max"]:
            level = "AMBER"
            reasons.append(f"Elevated peri-wound redness ({redness_pct}%)")
            
        if pus_pct > RISK_THRESHOLDS["GREEN"]["pus_max"]:
            level = "AMBER"
            reasons.append(f"Visual presence of exudate ({pus_pct}%)")

    if not reasons and level == "GREEN":
        reasons.append("Healing is progressing within expected visual parameters.")

    return {
        "risk_level": level,
        "alert_reasons": reasons,
        "area_change_pct": round(area_change, 1)
    }


def analyze_trajectory(
    area_history: List[float],
    segmentation_mode: str = "normal",
    redness_pct: float = 0.0,
    pus_pct: float = 0.0
) -> Dict[str, Any]:
    """
    Orchestrate trajectory analysis.
    """
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
    
    if not area_history or len(area_history) == 0:
        return {
            "trajectory_status": "insufficient_data",
            "risk_level": RISK_GREEN,
            "trajectory": {"expected": [], "actual": []},
            "alert": False,
            "reason": "Not enough data for trajectory analysis"
        }
    
    initial_area = area_history[0]
    num_days = len(area_history)
    current_area = area_history[-1]
    previous_area = area_history[-2] if len(area_history) > 1 else initial_area
    
    expected_curve = calculate_expected_trajectory(initial_area, days=num_days)
    
    risk_data = determine_risk_level(current_area, previous_area, redness_pct, pus_pct)
    
    return {
        "trajectory_status": "analyzed",
        "risk_level": risk_data["risk_level"],
        "trajectory": {
            "expected": expected_curve,
            "actual": area_history
        },
        "alert": risk_data["risk_level"] in [RISK_AMBER, RISK_RED],
        "reason": "; ".join(risk_data["alert_reasons"])
    }


def get_mock_trajectory() -> Dict[str, Any]:
    """Mock trajectory for demo mode."""
    return {
        "expected": [12.0, 10.8, 9.7, 8.7, 7.8],
        "actual": [12.0, 11.5, 11.3, 11.2, 11.2],
        "method": "mock"
    }
