import sys
import tempfile
from pathlib import Path

import fitz

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.utils.pdf import extract_text_from_pdf
from tests.util.fixture_io import write_stage_artifact


def test_extract_resume():
    # The PDF is generated in a temporary directory so no real resume or
    # generated binary artifact needs to be committed to the repository.
    with tempfile.TemporaryDirectory() as temporary_dir:
        sample_pdf_path = Path(temporary_dir) / "synthetic_resume.pdf"
        document = fitz.open()
        page = document.new_page()
        page.insert_text((72, 72), "Synthetic Candidate\nPython developer\nFastAPI")
        document.save(sample_pdf_path)
        document.close()

        artifact = extract_text_from_pdf(str(sample_pdf_path), source_name="synthetic_resume.pdf")

    path = write_stage_artifact(
        "extraction",
        "synthetic_resume",
        "extracted_resume_text.v1.json",
        artifact,
    )

    print(f"✓ wrote {path}, {len(artifact.cv_text)} chars")


if __name__ == "__main__":
    test_extract_resume()
