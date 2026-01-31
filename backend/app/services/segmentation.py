"""
Segmentation Service

Wound segmentation using MobileSAM with ONNX Runtime.
Generates wound mask and peri-wound mask (20px margin).

This module is inference-only and demo-safe.
NO training, NO fine-tuning, NO dataset loading.
"""

import os
from typing import Dict, Tuple, Optional
import numpy as np

# Lazy imports for optional dependencies
cv2 = None
ort = None

def _ensure_cv2():
    """Lazy load OpenCV."""
    global cv2
    if cv2 is None:
        import cv2 as _cv2
        cv2 = _cv2
    return cv2

def _ensure_onnxruntime():
    """Lazy load ONNX Runtime."""
    global ort
    if ort is None:
        import onnxruntime as _ort
        ort = _ort
    return ort


# ============================================================
# Model Singleton (loaded once, kept in memory)
# ============================================================

class MobileSAMPredictor:
    """
    Singleton wrapper for MobileSAM ONNX model.
    Loads model once and reuses for all inference calls.
    """
    _instance: Optional['MobileSAMPredictor'] = None
    _initialized: bool = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if MobileSAMPredictor._initialized:
            return
        
        self.encoder_session = None
        self.decoder_session = None
        self.model_loaded = False
        self.image_size = 1024  # MobileSAM input size
        
        MobileSAMPredictor._initialized = True
    
    def load_model(self, encoder_path: str, decoder_path: str) -> bool:
        """
        Load MobileSAM ONNX encoder and decoder models.
        
        Args:
            encoder_path: Path to encoder ONNX file
            decoder_path: Path to decoder ONNX file
            
        Returns:
            True if models loaded successfully, False otherwise
        """
        if self.model_loaded:
            return True
        
        try:
            ort = _ensure_onnxruntime()
            
            # Check if model files exist
            if not os.path.exists(encoder_path) or not os.path.exists(decoder_path):
                return False
            
            # Load encoder
            self.encoder_session = ort.InferenceSession(
                encoder_path,
                providers=['CPUExecutionProvider']
            )
            
            # Load decoder
            self.decoder_session = ort.InferenceSession(
                decoder_path,
                providers=['CPUExecutionProvider']
            )
            
            self.model_loaded = True
            return True
            
        except Exception:
            self.model_loaded = False
            return False
    
    def predict(self, image: np.ndarray, point: Tuple[int, int]) -> Optional[np.ndarray]:
        """
        Run MobileSAM inference to generate wound mask.
        
        Args:
            image: RGB image as numpy array (H, W, 3)
            point: (x, y) point inside the wound
            
        Returns:
            Binary mask (H, W) or None if inference fails
        """
        if not self.model_loaded:
            return None
        
        try:
            cv2 = _ensure_cv2()
            
            original_h, original_w = image.shape[:2]
            
            # Preprocess image for encoder
            input_image = self._preprocess_image(image)
            
            # Run encoder
            encoder_inputs = {
                self.encoder_session.get_inputs()[0].name: input_image
            }
            image_embedding = self.encoder_session.run(None, encoder_inputs)[0]
            
            # Prepare point prompt
            # Scale point to model input size
            scale_x = self.image_size / original_w
            scale_y = self.image_size / original_h
            scaled_point = np.array([[
                [point[0] * scale_x, point[1] * scale_y]
            ]], dtype=np.float32)
            point_labels = np.array([[1]], dtype=np.float32)  # 1 = foreground
            
            # Prepare decoder inputs
            mask_input = np.zeros((1, 1, 256, 256), dtype=np.float32)
            has_mask_input = np.array([0], dtype=np.float32)
            orig_im_size = np.array([original_h, original_w], dtype=np.float32)
            
            decoder_inputs = {
                'image_embeddings': image_embedding,
                'point_coords': scaled_point,
                'point_labels': point_labels,
                'mask_input': mask_input,
                'has_mask_input': has_mask_input,
                'orig_im_size': orig_im_size
            }
            
            # Run decoder
            masks, scores, _ = self.decoder_session.run(None, decoder_inputs)
            
            # Get best mask (highest score)
            best_idx = np.argmax(scores[0])
            mask = masks[0, best_idx]
            
            # Threshold to binary
            binary_mask = (mask > 0).astype(np.uint8)
            
            # Resize to original image size if needed
            if binary_mask.shape != (original_h, original_w):
                binary_mask = cv2.resize(
                    binary_mask, 
                    (original_w, original_h), 
                    interpolation=cv2.INTER_NEAREST
                )
            
            return binary_mask
            
        except Exception:
            return None
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for MobileSAM encoder.
        
        Args:
            image: RGB image (H, W, 3)
            
        Returns:
            Preprocessed image tensor (1, 3, 1024, 1024)
        """
        cv2 = _ensure_cv2()
        
        # Resize to model input size
        resized = cv2.resize(image, (self.image_size, self.image_size))
        
        # Normalize to [0, 1]
        normalized = resized.astype(np.float32) / 255.0
        
        # Apply ImageNet normalization
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized = (normalized - mean) / std
        
        # Transpose to (C, H, W) and add batch dimension
        transposed = normalized.transpose(2, 0, 1)
        batched = np.expand_dims(transposed, axis=0)
        
        return batched.astype(np.float32)


# Global predictor instance
_predictor: Optional[MobileSAMPredictor] = None


def _get_predictor() -> MobileSAMPredictor:
    """Get or create the global MobileSAM predictor."""
    global _predictor
    if _predictor is None:
        _predictor = MobileSAMPredictor()
        
        # Try to load models from expected paths
        model_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
        encoder_path = os.path.join(model_dir, 'mobile_sam_encoder.onnx')
        decoder_path = os.path.join(model_dir, 'mobile_sam_decoder.onnx')
        
        _predictor.load_model(encoder_path, decoder_path)
    
    return _predictor


# ============================================================
# Peri-Wound Mask Generation
# ============================================================

def _generate_peri_wound_mask(wound_mask: np.ndarray, dilation_px: int = 20) -> np.ndarray:
    """
    Generate peri-wound mask by dilating wound mask and subtracting original.
    
    Args:
        wound_mask: Binary wound mask (H, W)
        dilation_px: Dilation radius in pixels (default 20)
        
    Returns:
        Binary peri-wound mask (ring around wound)
    """
    cv2 = _ensure_cv2()
    
    # Create circular structuring element
    kernel_size = dilation_px * 2 + 1
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, 
        (kernel_size, kernel_size)
    )
    
    # Dilate wound mask
    dilated = cv2.dilate(wound_mask, kernel, iterations=1)
    
    # Peri-wound = dilated - original (ring around wound)
    peri_wound = dilated - wound_mask
    
    # Ensure binary
    peri_wound = (peri_wound > 0).astype(np.uint8)
    
    return peri_wound


# ============================================================
# Demo Fallback (Circular Mask)
# ============================================================

def _generate_demo_masks(
    image_shape: Tuple[int, int], 
    point: Tuple[int, int],
    radius: int = 80
) -> Dict[str, np.ndarray]:
    """
    Generate simple circular masks for demo/fallback mode.
    
    Args:
        image_shape: (H, W) of the image
        point: (x, y) center point
        radius: Radius of the circular wound mask
        
    Returns:
        Dict with 'wound_mask' and 'peri_wound_mask'
    """
    cv2 = _ensure_cv2()
    
    h, w = image_shape
    x, y = point
    
    # Clamp point to image bounds
    x = max(radius, min(w - radius, x))
    y = max(radius, min(h - radius, y))
    
    # Create wound mask (filled circle)
    wound_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.circle(wound_mask, (x, y), radius, 1, -1)
    
    # Create peri-wound mask (ring)
    peri_wound_mask = _generate_peri_wound_mask(wound_mask, dilation_px=20)
    
    return {
        'wound_mask': wound_mask,
        'peri_wound_mask': peri_wound_mask
    }


# ============================================================
# Mask Validation
# ============================================================

def _validate_mask(mask: np.ndarray, image_shape: Tuple[int, int]) -> bool:
    """
    Validate that a mask is reasonable.
    
    Args:
        mask: Binary mask to validate
        image_shape: Expected (H, W)
        
    Returns:
        True if mask is valid, False otherwise
    """
    if mask is None:
        return False
    
    if mask.shape != image_shape:
        return False
    
    # Check mask is not empty
    mask_sum = np.sum(mask)
    if mask_sum == 0:
        return False
    
    # Check mask is not the entire image (>90% coverage is suspicious)
    total_pixels = image_shape[0] * image_shape[1]
    if mask_sum > 0.9 * total_pixels:
        return False
    
    return True


# ============================================================
# Main Segmentation Function
# ============================================================

def segment_wound(
    image: np.ndarray,
    point: Tuple[int, int],
    demo_mode: bool
) -> Dict[str, np.ndarray]:
    """
    Segment wound and generate peri-wound mask.
    
    Args:
        image: RGB image as numpy array (H, W, 3)
        point: (x, y) point clicked inside the wound
        demo_mode: If True, use fallback circular masks on failure
        
    Returns:
        Dict with:
            - 'wound_mask': Binary mask (0/1), shape (H, W), dtype uint8
            - 'peri_wound_mask': Binary mask (0/1), shape (H, W), dtype uint8
    """
    _ensure_cv2()
    
    # Validate input
    if image is None or len(image.shape) != 3 or image.shape[2] != 3:
        # Invalid input - return demo masks
        if image is not None and len(image.shape) >= 2:
            return _generate_demo_masks(image.shape[:2], point)
        else:
            return _generate_demo_masks((480, 640), point)
    
    image_shape = (image.shape[0], image.shape[1])
    
    # Try real segmentation if not in demo mode
    wound_mask = None
    if not demo_mode:
        predictor = _get_predictor()
        if predictor.model_loaded:
            wound_mask = predictor.predict(image, point)
    
    # Validate mask
    if not _validate_mask(wound_mask, image_shape):
        # Fallback to demo masks
        return _generate_demo_masks(image_shape, point)
    
    # Generate peri-wound mask from valid wound mask
    peri_wound_mask = _generate_peri_wound_mask(wound_mask, dilation_px=20)
    
    # Ensure output is uint8
    wound_mask = wound_mask.astype(np.uint8)
    peri_wound_mask = peri_wound_mask.astype(np.uint8)
    
    return {
        'wound_mask': wound_mask,
        'peri_wound_mask': peri_wound_mask
    }


# ============================================================
# Legacy Compatibility (for existing code)
# ============================================================

def get_mock_segmentation() -> Dict[str, any]:
    """
    Return mock segmentation metadata.
    Kept for backward compatibility with existing code.
    
    Returns:
        Dict containing mock segmentation metadata.
    """
    return {
        "mask_available": True,
        "confidence": 0.95,
        "method": "demo_fallback",
        "note": "Using demo circular mask"
    }
