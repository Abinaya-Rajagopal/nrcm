"""
Session Service

Manages in-memory storage of wound observations to simulate a multi-day timeline.
This allows the user to upload multiple images and build a trajectory.
"""

from typing import List, Dict, Any
from datetime import datetime
import numpy as np

# Global in-memory storage
# Structure: Dict[str, List[Dict[str, Any]]]
# Key: session_id
_SESSIONS: Dict[str, List[Dict[str, Any]]] = {}


def add_observation(session_id: str, area: float, redness: float, pus: float) -> int:
    """
    Add a new observation to the specific session.
    Creates session if not exists.
    Returns the new day index (1-based).
    """
    if session_id not in _SESSIONS:
        _SESSIONS[session_id] = []
        
    _SESSIONS[session_id].append({
        "timestamp": datetime.utcnow().isoformat(),
        "area": area,
        "redness": redness,
        "pus": pus
    })
    return len(_SESSIONS[session_id])


def get_history(session_id: str) -> List[Dict[str, Any]]:
    """Get all recorded observations for a session."""
    return _SESSIONS.get(session_id, [])


def get_baseline_area(session_id: str) -> float:
    """Get the area from Day 1 (first observation) for this session."""
    history = _SESSIONS.get(session_id, [])
    if not history:
        return 0.0
    return history[0]["area"]


def get_latest_metrics(session_id: str) -> Dict[str, Any]:
    """Get the most recent observation for this session."""
    history = _SESSIONS.get(session_id, [])
    if not history:
        return {}
    return history[-1]


def clear_session(session_id: str):
    """Reset a specific session."""
    if session_id in _SESSIONS:
        del _SESSIONS[session_id]
