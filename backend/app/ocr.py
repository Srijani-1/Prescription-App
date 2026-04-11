import easyocr
import cv2
import numpy as np
import os

reader = easyocr.Reader(['en'], gpu=False)


def preprocess_image(image_path: str) -> str:
    img = cv2.imread(image_path)
    h, w = img.shape[:2]
    scale = max(2.0, 1800 / w)
    img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, h=10)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # Try Otsu first; if avg brightness suggests bad result, use adaptive
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    white_ratio = cv2.countNonZero(otsu) / otsu.size
    
    if white_ratio > 0.85 or white_ratio < 0.15:
        # Otsu failed — use adaptive threshold (better for uneven lighting)
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 31, 10
        )
    else:
        thresh = otsu

    processed_path = image_path.replace(".", "_processed.")
    cv2.imwrite(processed_path, thresh)
    return processed_path
    
def extract_text(image_path: str) -> dict:
    processed_path = preprocess_image(image_path)

    result = reader.readtext(
        processed_path,
        detail=1,
        paragraph=False,
        width_ths=0.7,
        contrast_ths=0.05,
        adjust_contrast=0.7,
        text_threshold=0.5,
        low_text=0.3,
    )

    words = []
    easy_text_parts = []
    confidences = []

    for (bbox, text, conf) in result:
        processed_bbox = [[int(v) for v in pt] for pt in bbox]
        conf_val = float(conf)

        confidence_label = (
            "High" if conf_val > 0.8 else
            "Medium" if conf_val > 0.5 else
            "Low"
        )

        words.append({
            "bbox": processed_bbox,
            "text": str(text),
            "confidence": round(conf_val * 100, 2),
            "confidence_label": confidence_label
        })

        easy_text_parts.append(str(text))
        confidences.append(conf_val)

    easy_text = " ".join(easy_text_parts)
    print("EasyOCR raw:", easy_text)

    avg_conf = round(
        (sum(confidences) / len(confidences)) * 100, 2
    ) if confidences else 0.0

    if os.path.exists(processed_path):
        os.remove(processed_path)

    return {
        "full_text": easy_text.strip(),
        "easyocr_text": easy_text,
        "trocr_text": "",
        "words": words,
        "avg_confidence": avg_conf
    }
