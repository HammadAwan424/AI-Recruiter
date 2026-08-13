import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.gmail.send_mails import send_email_service

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
    Stage 8: Tests outbound email sending via send_email_service()
    and checkpoints output to 08_send_email_result.json.
    """
    print(f"--> Target Recipient: {TEST_RECIPIENT_EMAIL}")

    result = send_email_service(
        recipient_email=TEST_RECIPIENT_EMAIL,
        subject=TEST_SUBJECT,
        body_text=TEST_BODY_TEXT,
        html_content=TEST_HTML_CONTENT
    )

    output_dir = os.path.join(os.path.dirname(__file__), "test_fixtures", "gmail")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "08_send_email_result.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"✓ Email sent successfully! Message ID: {result.get('message_id')}")
    print(f"✓ wrote {output_path}")


if __name__ == "__main__":
    test_send_email()
