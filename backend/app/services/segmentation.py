"""
Segmentation Service

Stub for wound segmentation logic.
Will integrate MobileSAM in the future.

⚠️ NO REAL ML LOGIC YET - Returns mock data only.
"""

from typing import Dict, Any


def get_mock_segmentation() -> Dict[str, Any]:
    """
    Return mock segmentation data.
    
    Future implementation will use MobileSAM for actual segmentation.
    
    Returns:
        Dict containing mock segmentation metadata.
    """
    return {
        "mask_available": False,
        "confidence": 0.0,
        "method": "mock",
        "note": "Real segmentation not yet implemented"
    }


def segment_wound(image_data: bytes) -> Dict[str, Any]:
    """
    Stub for real wound segmentation.
    
    Args:
        image_data: Raw image bytes
        
    Returns:
        Segmentation result (currently mock)
        
    TODO:
        - Integrate MobileSAM
        - Return actual mask coordinates
        - Calculate wound boundary
    """
    # NOT IMPLEMENTED - Return mock
    return get_mock_segmentation()
