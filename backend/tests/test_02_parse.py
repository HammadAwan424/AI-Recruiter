import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.parsing import parse_resume_structured


def test_parse():
    input_path = os.path.join(os.path.dirname(__file__), "test_fixtures", "sample_01", "01_cv_text.txt")
    assert os.path.exists(input_path), f"Input text file not found at {input_path}. Please run test_01_extract.py first."

    with open(input_path, "r", encoding="utf-8") as f:
        cv_text = f.read()

    result = parse_resume_structured(cv_text)

    output_path = os.path.join(os.path.dirname(__file__), "test_fixtures", "sample_01", "02_parsed_profile.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result.model_dump(), f, indent=2)

    print("✓ parsed skills:", result.skills[:3], "...")
    print(f"✓ wrote {output_path}")


if __name__ == "__main__":
    test_parse()
