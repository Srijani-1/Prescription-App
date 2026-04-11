import re

def clean_text(text: str) -> str:
    text = text.lower()

    corrections = {
        "paracitamol": "paracetamol",
        "paracetmol": "paracetamol",
        "pcm": "paracetamol",
        "dolo650": "dolo 650",
        "calpol": "calpol",
        "meftal": "meftal",
    }

    for wrong, correct in corrections.items():
        text = text.replace(wrong, correct)

    # ❌ REMOVED: text.replace("0", "o") — this was corrupting medicine names!

    # Keep letters, numbers, slashes, dots (important for doses like 250/5)
    text = re.sub(r'[^a-z0-9\s/.]', ' ', text)
    text = re.sub(r'\s+', ' ', text)

    return text.strip()
