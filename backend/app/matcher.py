import httpx
from rapidfuzz import fuzz

# Module-level cache: persists for lifetime of server process
cache = {}

def search_rxnorm(term):
    term = term.lower().strip()

    if term in cache:
        return cache[term]

    try:
        resp = httpx.get(
            "https://rxnav.nlm.nih.gov/REST/approximateTerm.json",
            params={"term": term, "maxEntries": 5},
            timeout=3
        )
        data = resp.json()
        results = [c["name"] for c in data.get("approximateGroup", {}).get("candidate", [])]

        cache[term] = results
        return results

    except:
        cache[term] = []
        return []

def detect_medicines(text: str):
    return []  # LLM handles everything, RxNorm removed
