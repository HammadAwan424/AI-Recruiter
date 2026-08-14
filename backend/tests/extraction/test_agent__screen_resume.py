import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.agents.screening.evaluator import evaluate_cv_structured
from app.schemas.extraction import (
    ExtractedResumeText,
    JobSpec,
    ResumeScreeningInput,
)
from tests.util.fixture_io import (
    fixture_path,
    read_schema,
    read_stage_schema,
    write_stage_artifact,
)


def test_screen_resume():
    extracted = read_stage_schema(
        "extraction",
        "synthetic_resume",
        "extracted_resume_text.v1.json",
        ExtractedResumeText,
    )
    job = read_schema(
        fixture_path(
            "extraction",
            "synthetic_resume",
            "inputs",
            "job_spec.v1.json",
        ),
        JobSpec,
    )

    artifact = evaluate_cv_structured(
        ResumeScreeningInput(
            schema_version="extraction.resume_screening_input.v1",
            source_name=extracted.source_name,
            resume=extracted,
            job=job,
        )
    )

    output_path = write_stage_artifact(
        "extraction",
        "synthetic_resume",
        "screening_result.v1.json",
        artifact,
    )

    print(f"✓ scores: experience_match={artifact.result.experience_match}, education_match={artifact.result.education_match}, confidence={artifact.result.confidence}")
    print(f"✓ fit flags count: {len(artifact.result.fit_flags)}")
    print(f"✓ wrote {output_path}")


if __name__ == "__main__":
    test_screen_resume()
