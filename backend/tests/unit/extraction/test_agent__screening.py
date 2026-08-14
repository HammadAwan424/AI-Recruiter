import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

BACKEND_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(BACKEND_ROOT))

from app.agents.screening.evaluator import sanitize_input_node, validate_output_node
from app.schemas.extraction import ExtractedResumeText, JobSpec, ResumeScreeningInput
from app.schemas.screening import EvidenceBlock, EvidenceSet


class ScreeningAgentTests(unittest.TestCase):
    def test_sanitize_input_truncates_resume_text(self):
        state = {
            "cv_text": "x" * 5000,
            "job_title": "Engineer",
            "job_description": "",
            "job_skills": "Python",
            "sanitized_cv": "",
            "llm_output": None,
            "error": "old error",
        }

        result = sanitize_input_node(state)

        self.assertEqual(len(result["sanitized_cv"]), 4000)
        self.assertEqual(result["error"], "")

    def test_validate_output_clamps_scores(self):
        evidence = EvidenceSet(
            skills_match=EvidenceBlock(),
            experience_match=EvidenceBlock(),
            education_match=EvidenceBlock(),
            keyword_coverage=EvidenceBlock(),
        )
        output = SimpleNamespace(
            skills_match=120,
            experience_match=-10,
            education_match=50,
            keyword_coverage=50,
            confidence=140,
            evidence=evidence,
            fit_flags=[],
            data_quality_flag=None,
        )
        state = {"llm_output": output, "error": ""}

        result = validate_output_node(state)

        self.assertEqual(result["llm_output"].skills_match, 100)
        self.assertEqual(result["llm_output"].experience_match, 0)
        self.assertEqual(result["llm_output"].confidence, 100)

    def test_screening_input_is_the_application_boundary(self):
        screening_input = ResumeScreeningInput(
            schema_version="extraction.resume_screening_input.v1",
            source_name="resume.pdf",
            resume=ExtractedResumeText(
                schema_version="extraction.extracted_resume_text.v1",
                source_name="resume.pdf",
                cv_text="Python developer",
            ),
            job=JobSpec(
                schema_version="extraction.job_spec.v1",
                title="AI Engineer",
                description="Build AI systems",
                skills="Python",
            ),
        )

        self.assertEqual(screening_input.resume.cv_text, "Python developer")
        self.assertEqual(screening_input.job.title, "AI Engineer")


if __name__ == "__main__":
    unittest.main()
