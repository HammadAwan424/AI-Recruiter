import json
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
    temperature=0.1,
    max_tokens=1500
)

EMPTY_PROFILE = {
    "skills": [],
    "total_experience_years": None,
    "experience": [],
    "education": [],
    "certifications": []
}


# ──── CV se structured profile (skills/experience/education) nikaalo ────
def parse_resume(cv_text: str) -> dict:
    if not cv_text or not cv_text.strip():
        return dict(EMPTY_PROFILE)

    prompt = f"""
You are an expert resume parser. Extract a structured profile from this CV text.

CV TEXT:
{cv_text[:4000]}

Return ONLY this JSON, no extra text:
{{
    "skills": ["<skill1>", "<skill2>", ...],
    "total_experience_years": <number, best estimate, or null if unknown>,
    "experience": [
        {{"title": "<job title>", "company": "<company name>", "duration": "<e.g. Jan 2021 - Present>"}}
    ],
    "education": [
        {{"degree": "<degree/qualification>", "institution": "<school/university>", "year": "<year or range>"}}
    ],
    "certifications": ["<certification1>", ...]
}}

If a section is not present in the CV, return an empty list for it. Return ONLY JSON.
"""
    messages = [
        SystemMessage(content="You are an expert resume parser. Always respond with valid JSON only."),
        HumanMessage(content=prompt)
    ]
    try:
        response = llm.invoke(messages)
        raw = response.content.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        result = json.loads(raw)

        return {
            "skills": result.get("skills") or [],
            "total_experience_years": result.get("total_experience_years"),
            "experience": result.get("experience") or [],
            "education": result.get("education") or [],
            "certifications": result.get("certifications") or []
        }
    except Exception as e:
        print(f"Resume parsing error: {e}")
        return dict(EMPTY_PROFILE)
