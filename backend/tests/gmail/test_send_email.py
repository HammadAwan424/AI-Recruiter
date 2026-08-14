import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.gmail.send_mails import send_email_service
from tests.util.fixture_io import write_stage_artifact

# ─────────────────────────────────────────────────────────────
# CONFIGURABLE TEST DATA FOR OUTBOUND EMAIL TEST
# ─────────────────────────────────────────────────────────────
TEST_RECIPIENT_EMAIL = "hammadawan424@gmail.com"
TEST_SUBJECT = "[AI Recruiter Test] Candidate Outbound Communication"
TEST_BODY_TEXT = (
    "Hello,\n\n"
    "This is an automated test email sent from the AI Recruiter backend service.\n"
    "Your application has been received and recorded successfully.\n\n"
    "Best regards,\nAI Recruiter Team"
)
TEST_HTML_CONTENT = (
    "<h2>AI Recruiter Communication Test</h2>"
    "<p>Hello,</p>"
    "<p>This is an automated test email sent from <strong>AI Recruiter backend service</strong>.</p>"
    "<p>Best regards,<br><em>AI Recruiter Team</em></p>"
)


def test_send_email():
    """
    Tests outbound email sending via send_email_service() and checkpoints
    output to the gitignored Gmail workflow artifacts directory.
    """
    print(f"--> Target Recipient: {TEST_RECIPIENT_EMAIL}")

    result = send_email_service(
        recipient_email=TEST_RECIPIENT_EMAIL,
        subject=TEST_SUBJECT,
        body_text=TEST_BODY_TEXT,
        html_content=TEST_HTML_CONTENT
    )

    artifact = result
    output_path = write_stage_artifact(
        "gmail",
        "company_sync",
        "outbound_email_result.v1.json",
        artifact,
    )

    print(f"✓ Email sent successfully! Message ID: {result.message_id}")
    print(f"✓ wrote {output_path}")


if __name__ == "__main__":
    test_send_email()
