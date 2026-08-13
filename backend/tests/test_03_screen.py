import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.screening.evaluator import evaluate_cv_structured

SAMPLE_JOB_TITLE = "Senior Data Scientist & Generative AI Engineer"
SAMPLE_JOB_DESCRIPTION = """
We are looking for a Senior Data Scientist / ML Engineer with deep expertise in Generative AI, RAG, LangChain, PyTorch, and cloud deployments (AWS/Azure/GCP).
Key Responsibilities:
- Design and deploy LLM applications, RAG pipelines, and autonomous AI agents.
- Train and fine-tune machine learning and deep learning models.
- Build production-ready REST APIs using FastAPI and Docker.
Requirements:
- 5+ years of experience in Python, ML frameworks (TensorFlow/PyTorch/Scikit-Learn).
- Hands-on experience with Vector Databases (Pinecone, ChromaDB, Faiss).
- Strong background in MLOps, CI/CD, and Cloud Machine Learning.
"""
SAMPLE_JOB_SKILLS = "Python, PyTorch, TensorFlow, LangChain, RAG, FastAPI, Docker, Vector Databases, MLOps, AWS"


def test_screen():
    cv_text_path = os.path.join(os.path.dirname(__file__), "test_fixtures", "sample_01", "01_cv_text.txt")
    parsed_profile_path = os.path.join(os.path.dirname(__file__), "test_fixtures", "sample_01", "02_parsed_profile.json")

    assert os.path.exists(cv_text_path), f"Input text file not found at {cv_text_path}. Please run test_01_extract.py first."
    assert os.path.exists(parsed_profile_path), f"Input profile JSON not found at {parsed_profile_path}. Please run test_02_parse.py first."

    with open(cv_text_path, "r", encoding="utf-8") as f:
        cv_text = f.read()

    with open(parsed_profile_path, "r", encoding="utf-8") as f:
        parsed_profile = json.load(f)

    result = evaluate_cv_structured(
        cv_text=cv_text,
        job_title=SAMPLE_JOB_TITLE,
        job_description=SAMPLE_JOB_DESCRIPTION,
        job_skills=SAMPLE_JOB_SKILLS
    )

    output_path = os.path.join(os.path.dirname(__file__), "test_fixtures", "sample_01", "03_screening_result.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result.model_dump(), f, indent=2)

    print(f"✓ scores: experience_match={result.experience_match}, education_match={result.education_match}, confidence={result.confidence}")
    print(f"✓ fit flags count: {len(result.fit_flags)}")
    print(f"✓ wrote {output_path}")


if __name__ == "__main__":
    test_screen()
