"""
Pydantic Schemas for API Request/Response Models

⚠️ WARNING: These schemas define the locked API contract.
DO NOT modify without team coordination.
Frontend development depends on this exact structure.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class TrajectoryData(BaseModel):
    """Healing trajectory comparison data."""
    expected: List[float] = Field(..., description="Expected healing trajectory (area in cm²)")
    actual: List[float] = Field(..., description="Actual observed trajectory (area in cm²)")


class AnalyzeResponse(BaseModel):
    """
    Response schema for /analyze endpoint.
    
    ⚠️ LOCKED CONTRACT - Do not modify without coordination.
    """
    area_cm2: float = Field(..., description="Wound area in square centimeters")
    redness_pct: float = Field(..., description="Percentage of wound showing redness")
    pus_pct: float = Field(..., description="Percentage of wound showing exudate/pus")
    risk_level: Literal["GREEN", "AMBER", "RED"] = Field(..., description="Risk assessment level")
    trajectory: TrajectoryData = Field(..., description="Healing trajectory data")
    alert_reason: Optional[str] = Field(None, description="Reason for alert if risk is elevated")


class AnalyzeRequest(BaseModel):
    """Request schema for /analyze endpoint."""
    image_base64: Optional[str] = Field(None, description="Base64 encoded wound image")
    use_demo_image: bool = Field(False, description="If true, use a demo fallback image")
