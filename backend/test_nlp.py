from app.nlp import extract_medicines

print("Testing with string:")
print(extract_medicines("I took Crocin 500mg today."))

print("\nTesting with dict:")
print(extract_medicines({"high_confidence_text": "I will take Paracetamol 500mg.", "full_text": "I will take Paracetamol 500mg today."}))
