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


class PatientMetadata(BaseModel):
    """Contextual patient information for simulation."""
    is_smoker: bool = Field(False, description="Whether the patient is a smoker")
    has_diabetes: bool = Field(False, description="Whether the patient has diabetes")
    age: Optional[int] = Field(None, description="Patient age")
    surgery_type: Optional[str] = Field(None, description="Type of surgery")
    has_reference_object: bool = Field(False, description="Whether a 1-euro coin or similar is in view")


class MeasurementData(BaseModel):
    """Ground truth visual measurements."""
    area_cm2: float = Field(..., description="Wound area in square centimeters")
    redness_pct: float = Field(..., description="Percentage of wound showing redness")
    pus_pct: float = Field(..., description="Percentage of wound showing exudate/pus")
    risk_level: Literal["GREEN", "AMBER", "RED"] = Field(..., description="Risk assessment level")
    trajectory: TrajectoryData = Field(..., description="Healing trajectory data")
    alert_reason: Optional[str] = Field(None, description="Reason for alert if risk is elevated")
    deviation_cm2: float = Field(0.0, description="Difference between actual and expected area")


class SimulationData(BaseModel):
    """Hypothetical simulation layer derived from measurements and metadata."""
    enabled: bool = Field(..., description="Whether simulation is active")
    assumptions_used: List[str] = Field(default_factory=list, description="List of assumptions applied")
    simulated_area_cm2: float = Field(..., description="Area adjusted by simulation parameters")
    reference_curve: List[float] = Field(..., description="Simulated expected healing curve")
    extrapolated_curve: List[float] = Field(..., description="Hypothetical visual trend extrapolation")
    completion_window_days: List[float] = Field(..., description="Estimated healing window [min, max]")
    confidence: Literal["LOW", "MEDIUM", "HIGH"] = Field("LOW", description="Confidence level of simulation")


class AnalysisFlags(BaseModel):
    """System state and processing flags."""
    demo_mode: bool = Field(..., description="Whether the system is in demo mode")
    fallback_segmentation: bool = Field(..., description="Whether fallback segmentation was used")
    research_mode: bool = Field(True, description="Always true in this version")


class ResearchMetadata(BaseModel):
    """Analysis tracking and timing metadata."""
    analysis_id: str = Field(..., description="Unique UUID for this analysis")
    captured_at: str = Field(..., description="ISO-8601 timestamp")
    day_index: Optional[int] = Field(None, description="Index of training day")
    observation_count: int = Field(..., description="Number of points in the actual trajectory")


class AnalyzeResponse(BaseModel):
    """
    Refactored Response schema for /analyze endpoint.
    Layered structure separating ground truth measurement from simulation.
    """
    measurement: MeasurementData
    simulation: Optional[SimulationData] = Field(None, description="Hypothetical simulation data")
    limitations: List[str] = Field(default_factory=list, description="Static list of analysis limitations")
    flags: AnalysisFlags
    metadata: ResearchMetadata


class AnalyzeRequest(BaseModel):
    """Request schema for /analyze endpoint."""
    image_base64: Optional[str] = Field(None, description="Base64 encoded wound image")
    use_demo_image: bool = Field(False, description="If true, use a demo fallback image")
    metadata: Optional[PatientMetadata] = Field(None, description="Optional patient metadata for simulation")
    enable_simulation: bool = Field(True, description="Whether to include the simulation layer in the response")


# ============================================================
# Debug / Inference Test Schemas
# ============================================================

class DebugInputInfo(BaseModel):
    """Debug information about the input image."""
    resolution: str = Field(..., description="Image resolution (WxH)")
    timestamp: str = Field(..., description="Processing timestamp")
    day_index: int = Field(0, description="Day index for trajectory")


class DebugSegmentationInfo(BaseModel):
    """Debug information about wound segmentation."""
    wound_mask_base64: str = Field(..., description="Base64 encoded binary wound mask")
    peri_wound_mask_base64: str = Field(..., description="Base64 encoded binary peri-wound mask")
    combined_viz_base64: str = Field(..., description="Masks overlaid on original image")
    used_model: bool = Field(..., description="Whether a real ML model was used")
    fallback: bool = Field(..., description="Whether fallback circular masks were used")


class DebugMetricsInfo(BaseModel):
    """Detailed metric calculation data."""
    area_cm2: float = Field(..., description="Calculated wound area")
    redness_pct: float = Field(..., description="Calculated redness percentage")
    pus_pct: float = Field(..., description="Calculated exudate/pus percentage")
    pixel_counts: dict = Field(..., description="Raw pixel counts for masks and regions")
    hsv_thresholds: dict = Field(..., description="HSV color space thresholds used")


class DebugHeatmapData(BaseModel):
    """Explainable heatmap outputs."""
    enabled: bool = Field(..., description="Whether heatmaps were generated")
    reason: Optional[str] = Field(None, description="Reason if heatmaps are disabled")
    redness_heatmap_base64: Optional[str] = None
    exudate_heatmap_base64: Optional[str] = None
    change_heatmap_base64: Optional[str] = None


class DebugAnalyzeResponse(BaseModel):
    """
    Comprehensive response for end-to-end inference testing.
    Includes both the layered research response and debug stages.
    """
    results: AnalyzeResponse
    input_debug: DebugInputInfo
    segmentation: DebugSegmentationInfo
    metrics: DebugMetricsInfo
    heatmaps: DebugHeatmapData
