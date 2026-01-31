"""
Session Service

Manages in-memory storage of wound observations to simulate a multi-day timeline.
This allows the user to upload multiple images and build a trajectory.
"""

from typing import List, Dict, Any
from datetime import datetime
import numpy as np

# Global in-memory storage
# Structure: List[Dict[str, Any]]
# Each item: { "timestamp": str, "area": float, "redness": float, "pus": float }
_SESSION_HISTORY = []

def add_observation(area: float, redness: float, pus: float) -> int:
    """
    Add a new observation to the session.
    Returns the new day index (1-based).
    """
    _SESSION_HISTORY.append({
        "timestamp": datetime.utcnow().isoformat(),
        "area": area,
        "redness": redness,
        "pus": pus
    })
    return len(_SESSION_HISTORY)

def get_history() -> List[Dict[str, Any]]:
    """Get all recorded observations."""
    return _SESSION_HISTORY

def get_baseline_area() -> float:
    """Get the area from Day 1 (first observation), or current if empty."""
    if not _SESSION_HISTORY:
        return 0.0
    return _SESSION_HISTORY[0]["area"]

def get_latest_metrics() -> Dict[str, Any]:
    """Get the most recent observation."""
    if not _SESSION_HISTORY:
        return {}
    return _SESSION_HISTORY[-1]

def clear_session():
    """Reset the session (useful for restarts)."""
    global _SESSION_HISTORY
    _SESSION_HISTORY = []
