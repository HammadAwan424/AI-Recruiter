import sys
import unittest
from pathlib import Path
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(BACKEND_ROOT))

from app.schemas.gmail import (
    JobClassificationBatchResult,
    JobClassificationJob,
    JobClassificationMessage,
    JobClassificationResult,
    JobClassificationRequest,
)
from app.agents.job_classification import classify_application_emails


class GmailJobClassificationTests(unittest.TestCase):
    def test_classifier_normalizes_unknown_job_ids_and_missing_results(self):
        messages = [
            JobClassificationMessage(gmail_message_id="message-1", subject="AI", text_content="AI role"),
            JobClassificationMessage(gmail_message_id="message-2", subject="Other", text_content="Other role"),
        ]
        jobs = [JobClassificationJob(id=10, title="AI Engineer")]
        raw_result = JobClassificationBatchResult(
            results=[
                JobClassificationResult(
                    gmail_message_id="message-1",
                    job_id=999,
                    confidence=100,
                    rationale="invented job",
                )
            ]
        )

        class FakeStructuredLLM:
            def with_structured_output(self, schema):
                return self

            def invoke(self, _messages):
                return raw_result

        with patch("app.agents.job_classification.classifier.get_llm", return_value=FakeStructuredLLM()):
            results = classify_application_emails(
                JobClassificationRequest(
                    schema_version="gmail.job_classification_request.v1",
                    company_id=1,
                    anchor_job_id=10,
                    messages=messages,
                    jobs=jobs,
                )
            )

        self.assertEqual(len(results.results), 2)
        self.assertIsNone(results.results[0].job_id)
        self.assertIsNone(results.results[1].job_id)
        self.assertIn("did not return", results.results[1].rationale)


if __name__ == "__main__":
    unittest.main()
