from app.llm import call_llm
import json
from rapidfuzz import fuzz

def find_bbox_for_medicine(med_name, ocr_words):
    """Find the bounding box in the OCR words that best matches a medicine name."""
    best_match = None
    best_score = 0
    
    med_lower = med_name.lower()
    
    # Try single word match first
    for word in ocr_words:
        score = fuzz.partial_ratio(med_lower, word["text"].lower())
        if score > best_score and score > 60:
            best_score = score
            best_match = word
    
    # Try matching ocr_fragment if provided
    return best_match

def structure_medicines(meds, text, country="India", ocr_words=None):
    if not meds:
        return []

    # Extract just names for the LLM (meds may now be objects with confidence)
    med_names = []
    med_confidence_map = {}
    for m in meds:
        if isinstance(m, dict):
            name = m.get("name", "")
            med_names.append(name)
            med_confidence_map[name] = m.get("confidence", 0.7)
        else:
            med_names.append(m)
            med_confidence_map[m] = 0.7

    prompt = f"""
You are a clinical pharmacist reading a medical prescription from {country}.

RAW OCR TEXT (your ONLY source of truth — do not add medicines not in this text):
---
{text}
---

Medicines found in OCR text: {med_names}

For each medicine, extract ONLY what is EXPLICITLY stated in the OCR text:
- name: corrected medicine name
- form: syrup/tablet/capsule/injection/cream/drops/ointment (empty string if not in text)
- dosage: e.g. "4ml", "500mg", "1 tablet" (empty string if not in OCR text)
- frequency: e.g. "TDS", "BD", "OD", "Q6H" (empty string if not in OCR text)
- duration: e.g. "3 days", "5 days" (empty string if not in OCR text)

IMPORTANT: If dosage/frequency/duration is not visible in the OCR text, return empty string.
Do NOT guess or infer from medical knowledge.

Return ONLY a JSON array. No explanation, no markdown.
"""

    response_text = call_llm(prompt)
    print("LLM structurer response:", response_text)

    try:
        clean = response_text.strip().strip("```json").strip("```").strip()
        structured = json.loads(clean)
    except:
        try:
            start = response_text.find("[")
            end = response_text.rfind("]")
            structured = json.loads(response_text[start:end+1])
        except:
            structured = [{"name": m, "form": "", "dosage": "", "frequency": "", "duration": ""} 
                         for m in med_names]

    # Attach confidence + bbox to each medicine
    for item in structured:
        name = item.get("name", "")
        item["confidence"] = med_confidence_map.get(name, 0.7)
        item["uncertain"] = med_confidence_map.get(name, 0.7) < 0.6
        
        # Find bounding box in OCR words
        if ocr_words:
            bbox_match = find_bbox_for_medicine(name, ocr_words)
            item["bbox"] = bbox_match["bbox"] if bbox_match else None
        else:
            item["bbox"] = None

    return structured
