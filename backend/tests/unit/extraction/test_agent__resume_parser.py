import sys
import unittest
from pathlib import Path
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(BACKEND_ROOT))

from app.agents.parsing.parser import parse_resume_structured
from app.schemas.extraction import ExtractedResumeText
from app.schemas.parsing import ParsingLLMOutput


class ResumeParserAgentTests(unittest.TestCase):
    def test_empty_resume_is_flagged_without_llm_call(self):
        result = parse_resume_structured(
            ExtractedResumeText(
                schema_version="extraction.extracted_resume_text.v1",
                source_name="empty.pdf",
                cv_text=" ",
            )
        )

        self.assertTrue(result.profile.needs_review)
        self.assertEqual(result.profile.skills, [])
        self.assertEqual(result.profile.review_reason, "Empty or missing resume text")

    def test_structured_result_is_returned(self):
        expected = ParsingLLMOutput(
            skills=["Python"],
            work_history=[],
            education=[],
            certifications=[],
            needs_review=False,
        )

        class FakeStructuredLLM:
            def with_structured_output(self, schema, include_raw=False):
                return self

            def invoke(self, _messages):
                return {"raw": object(), "parsed": expected}

        with patch("app.agents.parsing.parser.get_llm", return_value=FakeStructuredLLM()):
            result = parse_resume_structured(
                ExtractedResumeText(
                    schema_version="extraction.extracted_resume_text.v1",
                    source_name="resume.pdf",
                    cv_text="Python developer",
                )
            )

        self.assertEqual(result.profile, expected)


if __name__ == "__main__":
    unittest.main()
