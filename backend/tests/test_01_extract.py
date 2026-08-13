import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.utils.pdf import extract_text_from_pdf


def test_extract():
    sample_pdf_path = os.path.join(os.path.dirname(__file__), "Jillani Resume.pdf")
    assert os.path.exists(sample_pdf_path), f"Sample PDF not found at {sample_pdf_path}"

    output_dir = os.path.join(os.path.dirname(__file__), "test_fixtures", "sample_01")
    os.makedirs(output_dir, exist_ok=True)

    path = os.path.join(output_dir, "01_cv_text.txt")
    cv_text = extract_text_from_pdf(sample_pdf_path)

    with open(path, "w", encoding="utf-8") as f:
        f.write(cv_text)

    print(f"✓ wrote {path}, {len(cv_text)} chars")


if __name__ == "__main__":
    test_extract()
