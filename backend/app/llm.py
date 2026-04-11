import requests
import os
from dotenv import load_dotenv

load_dotenv()

FEATHERLESS_API_KEY = os.getenv("FEATHERLESS_API_KEY")

if not FEATHERLESS_API_KEY:
    raise ValueError("FEATHERLESS_API_KEY not found in environment variables")


def call_llm(prompt):
    return call_llm_chat([{"role": "user", "content": prompt}])

def call_llm_chat(messages):
    response = requests.post(
        "https://api.featherless.ai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {FEATHERLESS_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "deepseek-ai/DeepSeek-V3-0324",
            "messages": messages,
            "temperature": 0.5
        },
        timeout=30
    )

    data = response.json()
    if "choices" in data:
        return data["choices"][0]["message"]["content"]

    raise Exception(f"LLM Error: {data}")
