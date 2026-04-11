import torch
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import os

# Path to the local model weights
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../../models/trocr_model/content/trocr_model")

# Global variables for model and processor to load only once
_processor = None
_model = None

def get_trocr():
    global _processor, _model
    if _model is None:
        try:
            print(f"📦 Loading TrOCR from {MODEL_PATH}...")
            _processor = TrOCRProcessor.from_pretrained(MODEL_PATH)
            _model = VisionEncoderDecoderModel.from_pretrained(MODEL_PATH)
            
            # Use GPU if available
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _model.to(device)
            print(f"✅ TrOCR loaded on {device}")
        except Exception as e:
            print(f"❌ Error loading TrOCR: {e}")
            return None, None
    return _processor, _model

def run_trocr(image_path):
    """Run TrOCR inference on a cropped or full image."""
    processor, model = get_trocr()
    if not model:
        return ""
        
    try:
        image = Image.open(image_path).convert("RGB")
        device = model.device
        
        pixel_values = processor(images=image, return_tensors="pt").pixel_values.to(device)
        generated_ids = model.generate(pixel_values)
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        return generated_text.strip()
    except Exception as e:
        print(f"❌ TrOCR Inference error: {e}")
        return ""
