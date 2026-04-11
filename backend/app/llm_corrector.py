from app.llm import call_llm
import json

def correct_medicines(meds, text, country="India", trocr_text=""):
    prompt = f"""
You are a medical OCR correction expert. Your ONLY job is to find medicine names 
that are ALREADY PRESENT in the OCR text below. 

---
{text}
---

SUPPLEMENTARY HANDWRITING SCAN (TrOCR):
---
{trocr_text}
---

STRICT RULES:
- Use TrOCR text as a HINT, especially for cursive or messy handwriting.
- LLM JUDGMENT IS SUPREME: If TrOCR seems to contain gibberish or non-medical words, IGNORE it.
- NEVER add a medicine that is not supported by either the RAW OCR or TrOCR text.
- Fix only spelling/OCR errors (e.g. "CALP0L" → "Calpol", "Lev0lin" → "Levolin")
- If a word looks like a medicine name but you're unsure, include it with low confidence
- Do NOT include: patient name, doctor name, dates, diagnoses, clinic name, addresses
Return ONLY a JSON array of objects. No explanation, no markdown.
Each object: {{"name": "corrected name", "confidence": 0.0-1.0, "ocr_fragment": "original OCR word(s)"}}

High confidence (>0.8): clear medicine name with minor OCR error
Medium confidence (0.5-0.8): looks like a medicine but OCR is very noisy  
Low confidence (<0.5): uncertain, might be a medicine

Example:
[
  {{"name": "Calpol", "confidence": 0.95, "ocr_fragment": "CALP0L"}},
  {{"name": "Levolin", "confidence": 0.88, "ocr_fragment": "Lev0lin"}},
  {{"name": "Meftal-P", "confidence": 0.72, "ocr_fragment": "Meft4l P"}}
]
"""

    response_text = call_llm(prompt)
    print("LLM corrector response:", response_text)

    try:
        clean = response_text.strip().strip("```json").strip("```").strip()
        parsed = json.loads(clean)
        # Support both old format (plain strings) and new format (objects)
        result = []
        for item in parsed:
            if isinstance(item, str):
                result.append({"name": item, "confidence": 0.7, "ocr_fragment": item})
            elif isinstance(item, dict):
                result.append(item)
        return result
    except:
        try:
            start = response_text.find("[")
            end = response_text.rfind("]")
            return json.loads(response_text[start:end+1])
        except:
            return []
