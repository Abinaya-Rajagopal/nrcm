"""
Metrics Service

Stub for wound metric extraction (area, redness, exudate).
Will integrate HSV-based color analysis in the future.

⚠️ NO REAL CV LOGIC YET - Returns mock data only.
"""

from typing import Dict, Any


def get_mock_metrics() -> Dict[str, Any]:
    """
    Return mock wound metrics.
    
    Future implementation will use HSV color space analysis.
    
    Returns:
        Dict containing mock metric values.
    """
    return {
        "area_cm2": 12.4,
        "redness_pct": 18.2,
        "pus_pct": 4.1,
        "method": "mock",
        "note": "Real metric extraction not yet implemented"
    }


def calculate_wound_area(mask: Any, scale_factor: float = 1.0) -> float:
    """
    Stub for wound area calculation.
    
    Args:
        mask: Segmentation mask (not used yet)
        scale_factor: Pixels to cm² conversion factor
        
    Returns:
        Wound area in cm² (currently mock value)
        
    TODO:
        - Use actual mask pixel count
        - Apply calibration scale
    """
    # NOT IMPLEMENTED - Return mock
    return 12.4


def calculate_redness(image: Any, mask: Any) -> float:
    """
    Stub for redness percentage calculation.
    
    Args:
        image: Source image (not used yet)
        mask: Wound mask (not used yet)
        
    Returns:
        Redness percentage (currently mock value)
        
    TODO:
        - Convert to HSV color space
        - Analyze red channel within mask
    """
    # NOT IMPLEMENTED - Return mock
    return 18.2


def calculate_exudate(image: Any, mask: Any) -> float:
    """
    Stub for exudate/pus percentage calculation.
    
    Args:
        image: Source image (not used yet)
        mask: Wound mask (not used yet)
        
    Returns:
        Exudate percentage (currently mock value)
        
    TODO:
        - Detect yellow/white regions in HSV
        - Calculate percentage within wound area
    """
    # NOT IMPLEMENTED - Return mock
    return 4.1


def calculate_metrics(segmentation_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Orchestrate metric calculation based on segmentation result.
    
    Args:
        segmentation_result: Output from segmentation service
        
    Returns:
        Dict containing all required metrics for response
    """
    # In a real implementation, we would extract the masks from segmentation_result
    # and pass them to the specific calculation functions.
    # For now, we mock that flow.
    
    # mask = segmentation_result.get("mask")
    # image = segmentation_result.get("image")
    
    area = calculate_wound_area(None)
    redness = calculate_redness(None, None)
    pus = calculate_exudate(None, None)
    
    return {
        "area_cm2": area,
        "redness_pct": redness,
        "pus_pct": pus
    }
