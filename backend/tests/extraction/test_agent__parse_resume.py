import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.agents.parsing import parse_resume_structured
from app.schemas.extraction import ExtractedResumeText
from tests.util.fixture_io import read_stage_schema, write_stage_artifact


def test_parse_resume():
    extracted = read_stage_schema(
        "extraction",
        "synthetic_resume",
        "extracted_resume_text.v1.json",
        ExtractedResumeText,
    )

    artifact = parse_resume_structured(extracted)

    output_path = write_stage_artifact(
        "extraction",
        "synthetic_resume",
        "parsed_resume_profile.v1.json",
        artifact,
    )

    print("✓ parsed skills:", artifact.profile.skills[:3], "...")
    print(f"✓ wrote {output_path}")


if __name__ == "__main__":
    test_parse_resume()
