import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.gmail import fetch_mails
from app.services.gmail.fetch_mails import process_mails
from app.schemas.extraction import ExtractedResumeText
from app.schemas.gmail import DedupedGmailMessages
from tests.util.gmail_fakes import FakeGmailResource, encode_body


class GmailMessageProcessingTests(unittest.TestCase):
    def test_process_mails_extracts_subject_and_plain_text_for_every_message(self):
        messages = {
            "message-1": {
                "internalDate": "1760184000000",
                "snippet": "fallback",
                "payload": {
                    "headers": [
                        {"name": "FROM", "value": 'Candidate One <ONE@example.com>'},
                        {"name": "Subject", "value": "Application: AI Engineer"},
                    ],
                    "parts": [
                        {"mimeType": "text/plain", "body": {"data": encode_body("I am applying for AI Engineer.")}},
                        {"mimeType": "application/pdf", "filename": "resume.pdf", "body": {"attachmentId": "attachment-1"}},
                    ],
                },
            },
            "message-2": {
                "internalDate": "1760187600000",
                "snippet": "No resume body available",
                "payload": {
                    "headers": [{"name": "From", "value": "candidate2@example.com"}],
                    "parts": [],
                },
            },
        }

        with patch.dict(os.environ, {"PERSIST_CV": "false"}), patch.object(
            fetch_mails,
            "extract_pdf_text_and_bytes",
            return_value=(
                ExtractedResumeText(
                    schema_version="extraction.extracted_resume_text.v1",
                    source_name="resume.pdf",
                    cv_text="resume text",
                ),
                b"pdf bytes",
            ),
        ):
            result = process_mails(
                service=FakeGmailResource(messages),
                db=None,
                deduped_messages=DedupedGmailMessages(
                    schema_version="gmail.deduped_messages.v2",
                    company_id=1,
                    anchor_job_id=1,
                    gmail_account_id=1,
                    after_date_query="2026/08/01",
                    deduped_mails=[{"id": "message-1"}, {"id": "message-2"}],
                ),
            )

        self.assertEqual(len(result.messages), 2)
        self.assertEqual(result.messages[0].email, "one@example.com")
        self.assertEqual(result.messages[0].subject, "Application: AI Engineer")
        self.assertEqual(result.messages[0].text_content, "I am applying for AI Engineer.")
        self.assertEqual(result.messages[0].cv_text, "resume text")
        self.assertEqual(result.messages[1].text_content, "No resume body available")
        self.assertIsNone(result.messages[1].cv_text)


if __name__ == "__main__":
    unittest.main()
